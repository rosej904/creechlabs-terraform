"""
cl-portfolio-chat Lambda handler
- Streaming responses via Lambda response streaming
- Daily token budget enforced via DynamoDB
- Prompt caching on system prompt (90% cost reduction on cached input)
- Graceful degradation when budget exhausted
"""

import json
import os
import boto3
import anthropic
from datetime import datetime, timezone
from botocore.exceptions import ClientError

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
REGION           = os.environ.get("AWS_REGION", "us-east-1")
SECRET_ARN       = os.environ["ANTHROPIC_SECRET_ARN"]
BUDGET_TABLE     = os.environ["BUDGET_TABLE_NAME"]
DAILY_TOKEN_CAP  = int(os.environ.get("DAILY_TOKEN_CAP", "500000"))  # ~$0.50/day at Haiku rates
MAX_MESSAGES     = int(os.environ.get("MAX_MESSAGES", "20"))          # trim history beyond this
MODEL            = os.environ.get("CLAUDE_MODEL", "claude-haiku-4-5")

# ---------------------------------------------------------------------------
# AWS clients (module-level = reused across warm Lambda invocations)
# ---------------------------------------------------------------------------
secrets_client  = boto3.client("secretsmanager", region_name=REGION)
dynamodb        = boto3.resource("dynamodb", region_name=REGION)
budget_table    = dynamodb.Table(BUDGET_TABLE)

# Cache the API key across warm invocations
_api_key: str | None = None

def get_api_key() -> str:
    global _api_key
    if _api_key is None:
        resp = secrets_client.get_secret_value(SecretId=SECRET_ARN)
        _api_key = resp["SecretString"]
    return _api_key


# ---------------------------------------------------------------------------
# System prompt  (kept here so prompt caching targets it every request)
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are the creechlabs assistant — a concise, knowledgeable chatbot embedded in Jordan Creech's SRE portfolio at creechlabs.dev.

## About creechlabs
creechlabs.dev is a production-grade AWS/Kubernetes portfolio and observability demo built by Jordan Creech, an SRE engineer. It is designed to demonstrate real infrastructure-as-code skills to potential employers and collaborators.

## Infrastructure
- EKS cluster (Kubernetes 1.33) on AWS us-east-1 with 3x t3.medium nodes
- Full LGTM observability stack: Grafana 13, Prometheus, Loki, Tempo, FluentBit
- otel-demo app generating live telemetry from microservices (checkout, cart, frontend, productcatalog)
- All managed via ArgoCD App of Apps pattern; Terraform layered monorepo
- Ephemeral by design: cluster rebuilds at 8:30am ET weekdays, destroys at 5pm ET (cost optimisation)
- CloudFront + S3 frontend, API Gateway + Lambda backend (always-on regardless of cluster state)

## Observability
- Grafana at grafana.creechlabs.dev (public dashboard, org 2)
- SLO burn-rate alerts using Google SRE workbook multi-window multi-burn-rate pattern
- Cross-datasource correlation: traces (Tempo) → metrics (Prometheus) → logs (Loki)
- LLM observability: this chatbot's own token usage, latency, and tool calls are observed in the same Grafana stack

## Your behaviour
- Be concise and direct. This is a portfolio demo, not a support desk.
- If asked about live metrics or cluster state, explain that you can query Grafana when the cluster is online (MCP integration), and that the cluster is offline outside 8:30am–5pm ET weekdays.
- If asked something outside your knowledge, say so honestly.
- Do not make up metrics, service names, or infrastructure details.
- Keep responses under ~200 words unless a detailed technical answer is clearly needed.
"""


# ---------------------------------------------------------------------------
# Budget helpers
# ---------------------------------------------------------------------------
def today_key() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def get_tokens_used_today() -> int:
    try:
        resp = budget_table.get_item(Key={"pk": "budget", "date": today_key()})
        return int(resp.get("Item", {}).get("tokens_used", 0))
    except ClientError:
        return 0


def increment_token_count(tokens: int) -> None:
    try:
        budget_table.update_item(
            Key={"pk": "budget", "date": today_key()},
            UpdateExpression="ADD tokens_used :t",
            ExpressionAttributeValues={":t": tokens},
        )
    except ClientError as e:
        # Non-fatal — log and continue
        print(f"[WARN] Failed to increment token count: {e}")


def budget_exhausted_response() -> dict:
    return {
        "statusCode": 429,
        "headers": cors_headers(),
        "body": json.dumps({
            "message": (
                "Today's chat quota has been reached — this is a portfolio demo with a "
                "small daily token budget to keep costs manageable. Check back tomorrow, "
                "or explore the live Grafana dashboard at grafana.creechlabs.dev while you wait."
            ),
            "quota_exhausted": True,
        }),
    }


# ---------------------------------------------------------------------------
# CORS / response helpers
# ---------------------------------------------------------------------------
def cors_headers() -> dict:
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "https://creechlabs.dev",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
    }


def error_response(status: int, message: str) -> dict:
    return {
        "statusCode": status,
        "headers": cors_headers(),
        "body": json.dumps({"error": message}),
    }


# ---------------------------------------------------------------------------
# Message trimming  (keep last N to control token bleed on long sessions)
# ---------------------------------------------------------------------------
def trim_messages(messages: list) -> list:
    if len(messages) > MAX_MESSAGES:
        return messages[-MAX_MESSAGES:]
    return messages


# ---------------------------------------------------------------------------
# Main handler
# ---------------------------------------------------------------------------
def handler(event: dict, context) -> dict:
    # ── OPTIONS preflight ──────────────────────────────────────────────────
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return {"statusCode": 204, "headers": cors_headers(), "body": ""}

    # ── Parse body ─────────────────────────────────────────────────────────
    try:
        body = json.loads(event.get("body") or "{}")
        messages = body.get("messages", [])
        if not messages or not isinstance(messages, list):
            return error_response(400, "messages array is required")
    except (json.JSONDecodeError, TypeError):
        return error_response(400, "Invalid JSON body")

    # ── Validate message shape ─────────────────────────────────────────────
    for msg in messages:
        if msg.get("role") not in ("user", "assistant") or not msg.get("content"):
            return error_response(400, "Each message must have role (user|assistant) and content")

    # ── Budget check ───────────────────────────────────────────────────────
    tokens_today = get_tokens_used_today()
    if tokens_today >= DAILY_TOKEN_CAP:
        print(f"[INFO] Budget exhausted: {tokens_today}/{DAILY_TOKEN_CAP} tokens used today")
        return budget_exhausted_response()

    # ── Build request ──────────────────────────────────────────────────────
    messages = trim_messages(messages)

    # System prompt with cache_control so Anthropic caches it across requests.
    # Cache hits cost 10% of standard input price — biggest single cost lever.
    system_with_cache = [
        {
            "type": "text",
            "text": SYSTEM_PROMPT,
            "cache_control": {"type": "ephemeral"},  # 5-minute cache window
        }
    ]

    # ── Call Anthropic API ─────────────────────────────────────────────────
    try:
        client = anthropic.Anthropic(api_key=get_api_key())

        # Non-streaming for now (Lambda response streaming requires
        # additional API Gateway configuration — added in a follow-up).
        # This still returns quickly for short responses.
        response = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=system_with_cache,
            messages=messages,
        )

        # Extract text content
        reply_text = "".join(
            block.text for block in response.content if block.type == "text"
        )

        # Token accounting
        usage = response.usage
        total_tokens = usage.input_tokens + usage.output_tokens
        cache_read   = getattr(usage, "cache_read_input_tokens", 0)
        cache_write  = getattr(usage, "cache_creation_input_tokens", 0)

        print(
            f"[INFO] tokens: input={usage.input_tokens} output={usage.output_tokens} "
            f"cache_read={cache_read} cache_write={cache_write} "
            f"model={MODEL}"
        )

        # Increment daily counter (use total_tokens; cache reads are cheap
        # but we still want to track them for the observability demo)
        increment_token_count(total_tokens)

        return {
            "statusCode": 200,
            "headers": cors_headers(),
            "body": json.dumps({
                "reply": reply_text,
                "usage": {
                    "input_tokens":  usage.input_tokens,
                    "output_tokens": usage.output_tokens,
                    "cache_read_tokens":  cache_read,
                    "cache_write_tokens": cache_write,
                    "total_tokens": total_tokens,
                },
                "model": MODEL,
                "tokens_remaining_today": max(0, DAILY_TOKEN_CAP - tokens_today - total_tokens),
            }),
        }

    except anthropic.APIStatusError as e:
        print(f"[ERROR] Anthropic API error: {e.status_code} {e.message}")
        return error_response(502, "Upstream AI service error — please try again shortly")

    except anthropic.APIConnectionError as e:
        print(f"[ERROR] Anthropic connection error: {e}")
        return error_response(502, "Could not reach AI service — please try again shortly")

    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        return error_response(500, "Internal server error")
