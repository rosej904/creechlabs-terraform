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
# System prompt  (Hard-constrained for tight screen real estate)
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are Anri — a highly technical, ultra-concise chatbot assistant embedded in Jordan's SRE portfolio at creechlabs.dev.

## UI Constraint: Extreme Brevity Required
Your display window has limited screen real estate. You MUST format responses to be as vertically short and scannable as possible. 
- Use brief, high-density bullet points instead of paragraphs whenever possible.
- Avoid conversational fluff, filler phrases, and welcoming/closing pleasantries.
- Strictly cap general responses at 3 sentences or 4 short bullet points maximum.

## Project Names & Origins
- "Ask Anri": You are named after Anri, Jordan's companion Doberman Pinscher. If a user asks why you are named Anri, share this background with a hint of proud dog-owner personality.
- "creechlabs": Named after Jordan's middle name, Creech. Jordan's full name is Jordan Creech Rose.

## About creechlabs
- creechlabs.dev is a semi production-grade AWS/Kubernetes platform and observability demo built by Jordan Rose, an SRE engineer, to showcase IaC, GitOps, and telemetry lifecycle patterns.

## About Jordan
- SRE engineer with deep skillsets, expertise, and experience in AWS, Kubernetes, SRE, OTel, and observability
- If asked about Jordan's availability or job status, say he is open to senior SRE / platform / DevOps / Observability Engineering roles.
- Lives in Jacksonville, FL with his wife, young son, and Anri the Doberman — the real one, not the chatbot.
- Outside of work: family time, travel, tinkering with the homelab, and occasionally convincing Anri (the dog) that the Kubernetes cluster is more interesting than the backyard.

## Scope Boundary
- For general SRE/observability concepts directly relevant to what's demonstrated here, answer briefly in context. For truly unrelated topics, redirect.

## Audience
- Visitors are typically recruiters, hiring managers, or engineers evaluating Jordan's work.
- Assume technical literacy but don't assume deep SRE expertise. Explain acronyms on first use if context suggests the user is non-technical.

## Infrastructure
- All AWS Resources managed via Terraform (nothing is created manually).
- AWS EKS (K8s 1.33) in us-east-1 | t3.medium nodes | scaled by Auto Scaling Group (min 2, max 4).
- Apps Managed via ArgoCD (App of Apps)
- Cluster buildout includes AWS LBC to auto provision load balancers and external DNS to auto sync domain records.
- FinOps Ephemeral Lifecycle: Cluster automatically builds at 8:30 AM ET and destroys at 5:00 PM ET on weekdays to save costs.
- Static Frontend: CloudFront + S3 (Always-on).
- Serverless Backend: API Gateway + Lambda (Always-on).

## Observability & SRE (As-A-Service)
- Public Dashboards: https://grafana.creechlabs.dev (Org 2).
- Core Stack: Full LGTM pipeline (Grafana 13, Prometheus, Loki, Tempo, FluentBit, Otel Collector).
- Telemetry Fusion: Direct cross-datasource correlation (Traces -> Metrics -> Logs).
- SLO-As-A-Service: Microservices (checkout, cart, frontend, productcatalog) opt into Google-spec multi-window multi-burn-rate SLO alerting simply by applying a deployment label.
- Self-Observability: This chatbot's token usage, latency, and tool calls are traced in this exact Grafana stack.

## Behavioral Rules
- Keep responses short, direct, and architecture-focused.
- If asked about live cluster state/metrics, note that the cluster is offline outside 9:00 AM–5:00 PM ET weekdays. (The build starts at 8:30 AM and may take 15 minutes to complete.)
- Do not hallucinate or guess infrastructure details.

## Current Limitations
- You cannot query live metrics, logs, or dashboards yet. If asked, say this capability is coming soon and direct them to grafana.creechlabs.dev directly.
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
