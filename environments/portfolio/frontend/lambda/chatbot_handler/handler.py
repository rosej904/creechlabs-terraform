"""
cl-portfolio-chat Lambda handler
- Streaming responses via Lambda response streaming
- Daily token budget enforced via DynamoDB
- Prompt caching on system prompt (90% cost reduction on cached input)
- OTel instrumentation: traces -> Tempo, metrics -> Prometheus, logs -> Loki
- Graceful degradation when otel collector is unreachable (cluster offline)
"""

import json
import os
import time
import boto3
import anthropic
import requests
from datetime import datetime, timezone
from botocore.exceptions import ClientError

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
REGION           = os.environ.get("AWS_REGION", "us-east-1")
SECRET_ARN       = os.environ["ANTHROPIC_SECRET_ARN"]
BUDGET_TABLE     = os.environ["BUDGET_TABLE_NAME"]
DAILY_TOKEN_CAP  = int(os.environ.get("DAILY_TOKEN_CAP", "500000"))
MAX_MESSAGES     = int(os.environ.get("MAX_MESSAGES", "20"))
MODEL            = os.environ.get("CLAUDE_MODEL", "claude-haiku-4-5")
OTEL_ENDPOINT    = os.environ.get("OTEL_ENDPOINT", "https://otel.creechlabs.dev")
OTEL_SECRET_ARN  = os.environ.get("OTEL_SECRET_ARN", "")  # optional shared secret
SERVICE_NAME     = "cl-portfolio-chat"
SERVICE_VERSION  = "1.0.0"

# ---------------------------------------------------------------------------
# AWS clients (module-level = reused across warm invocations)
# ---------------------------------------------------------------------------
secrets_client = boto3.client("secretsmanager", region_name=REGION)
dynamodb       = boto3.resource("dynamodb", region_name=REGION)
budget_table   = dynamodb.Table(BUDGET_TABLE)

# Cached secrets across warm invocations
_api_key: str | None = None
_otel_token: str | None = None


def get_api_key() -> str:
    global _api_key
    if _api_key is None:
        resp = secrets_client.get_secret_value(SecretId=SECRET_ARN)
        _api_key = resp["SecretString"]
    return _api_key


def get_otel_token() -> str | None:
    global _otel_token
    if _otel_token is None and OTEL_SECRET_ARN:
        try:
            resp = secrets_client.get_secret_value(SecretId=OTEL_SECRET_ARN)
            _otel_token = resp["SecretString"]
        except ClientError:
            _otel_token = None
    return _otel_token


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
# OTel helpers
# ---------------------------------------------------------------------------
def generate_trace_id() -> str:
    import secrets
    return secrets.token_hex(16)  # 32-char hex = 128-bit trace ID


def generate_span_id() -> str:
    import secrets
    return secrets.token_hex(8)   # 16-char hex = 64-bit span ID


def check_collector_health() -> bool:
    """Fast health check — skip instrumentation if cluster is offline."""
    try:
        resp = requests.get(
            f"{OTEL_ENDPOINT}/",
            timeout=1.5,
            headers={"X-Health-Check": "true"},
        )
        return resp.status_code < 500
    except Exception:
        return False


def emit_otlp_trace(
    trace_id: str,
    span_id: str,
    start_ns: int,
    end_ns: int,
    status_code: int,
    input_tokens: int,
    output_tokens: int,
    cache_read_tokens: int,
    total_tokens: int,
    user_message: str,
) -> None:
    """Push a single span to the OTel collector via OTLP/HTTP."""

    # Truncate user message for span attribute (avoid storing full PII in traces)
    msg_preview = user_message[:100] + "..." if len(user_message) > 100 else user_message

    payload = {
        "resourceSpans": [
            {
                "resource": {
                    "attributes": [
                        {"key": "service.name",    "value": {"stringValue": SERVICE_NAME}},
                        {"key": "service.version", "value": {"stringValue": SERVICE_VERSION}},
                        {"key": "cloud.provider",  "value": {"stringValue": "aws"}},
                        {"key": "cloud.region",    "value": {"stringValue": REGION}},
                        {"key": "faas.name",       "value": {"stringValue": SERVICE_NAME}},
                    ]
                },
                "scopeSpans": [
                    {
                        "scope": {"name": SERVICE_NAME, "version": SERVICE_VERSION},
                        "spans": [
                            {
                                "traceId": trace_id,
                                "spanId": span_id,
                                "name": "gen_ai.chat",
                                "kind": 2,  # SPAN_KIND_SERVER
                                "startTimeUnixNano": str(start_ns),
                                "endTimeUnixNano": str(end_ns),
                                "status": {
                                    "code": 1 if status_code == 200 else 2  # OK or ERROR
                                },
                                "attributes": [
                                    # gen_ai semantic conventions
                                    {"key": "gen_ai.system",
                                     "value": {"stringValue": "anthropic"}},
                                    {"key": "gen_ai.operation.name",
                                     "value": {"stringValue": "chat"}},
                                    {"key": "gen_ai.request.model",
                                     "value": {"stringValue": MODEL}},
                                    {"key": "gen_ai.usage.input_tokens",
                                     "value": {"intValue": str(input_tokens)}},
                                    {"key": "gen_ai.usage.output_tokens",
                                     "value": {"intValue": str(output_tokens)}},
                                    {"key": "gen_ai.usage.total_tokens",
                                     "value": {"intValue": str(total_tokens)}},
                                    {"key": "gen_ai.usage.cache_read_tokens",
                                     "value": {"intValue": str(cache_read_tokens)}},
                                    # request context
                                    {"key": "http.status_code",
                                     "value": {"intValue": str(status_code)}},
                                    {"key": "gen_ai.prompt.preview",
                                     "value": {"stringValue": msg_preview}},
                                ],
                            }
                        ],
                    }
                ],
            }
        ]
    }

    headers = {"Content-Type": "application/json"}
    token = get_otel_token()
    if token:
        headers["X-OTel-Token"] = token

    try:
        requests.post(
            f"{OTEL_ENDPOINT}/v1/traces",
            json=payload,
            headers=headers,
            timeout=3.0,
        )
    except Exception as e:
        print(f"[WARN] OTel trace push failed (non-fatal): {e}")


def emit_otlp_metrics(
    input_tokens: int,
    output_tokens: int,
    cache_read_tokens: int,
    total_tokens: int,
    latency_ms: float,
) -> None:
    """Push token count and latency metrics to the OTel collector."""

    now_ns = str(int(time.time() * 1e9))
    common_attrs = [
        {"key": "service.name", "value": {"stringValue": SERVICE_NAME}},
        {"key": "gen_ai.system", "value": {"stringValue": "anthropic"}},
        {"key": "gen_ai.request.model", "value": {"stringValue": MODEL}},
    ]

    def gauge(name: str, description: str, value: float, attrs: list) -> dict:
        return {
            "name": name,
            "description": description,
            "gauge": {
                "dataPoints": [
                    {
                        "attributes": attrs,
                        "timeUnixNano": now_ns,
                        "asDouble": value,
                    }
                ]
            },
        }

    payload = {
        "resourceMetrics": [
            {
                "resource": {
                    "attributes": [
                        {"key": "service.name",
                         "value": {"stringValue": SERVICE_NAME}},
                        {"key": "cloud.provider",
                         "value": {"stringValue": "aws"}},
                    ]
                },
                "scopeMetrics": [
                    {
                        "scope": {"name": SERVICE_NAME},
                        "metrics": [
                            gauge("gen_ai.usage.input_tokens",
                                  "Input tokens per request",
                                  input_tokens, common_attrs),
                            gauge("gen_ai.usage.output_tokens",
                                  "Output tokens per request",
                                  output_tokens, common_attrs),
                            gauge("gen_ai.usage.cache_read_tokens",
                                  "Cache read tokens per request",
                                  cache_read_tokens, common_attrs),
                            gauge("gen_ai.usage.total_tokens",
                                  "Total tokens per request",
                                  total_tokens, common_attrs),
                            gauge("gen_ai.request.latency_ms",
                                  "End-to-end chat request latency in ms",
                                  latency_ms, common_attrs),
                        ],
                    }
                ],
            }
        ]
    }

    headers = {"Content-Type": "application/json"}
    token = get_otel_token()
    if token:
        headers["X-OTel-Token"] = token

    try:
        requests.post(
            f"{OTEL_ENDPOINT}/v1/metrics",
            json=payload,
            headers=headers,
            timeout=3.0,
        )
    except Exception as e:
        print(f"[WARN] OTel metrics push failed (non-fatal): {e}")



def emit_otlp_logs(
    trace_id: str,
    span_id: str,
    timestamp_ns: int,
    input_tokens: int,
    output_tokens: int,
    cache_read_tokens: int,
    total_tokens: int,
    latency_ms: float,
    status_code: int,
    user_message_preview: str,
) -> None:
    """Push a structured log record to the OTel collector -> Loki."""

    payload = {
        "resourceLogs": [
            {
                "resource": {
                    "attributes": [
                        {"key": "service.name",
                         "value": {"stringValue": SERVICE_NAME}},
                        {"key": "service.version",
                         "value": {"stringValue": SERVICE_VERSION}},
                        {"key": "cloud.provider",
                         "value": {"stringValue": "aws"}},
                        {"key": "cloud.region",
                         "value": {"stringValue": REGION}},
                    ]
                },
                "scopeLogs": [
                    {
                        "scope": {"name": SERVICE_NAME},
                        "logRecords": [
                            {
                                "timeUnixNano": str(timestamp_ns),
                                "severityNumber": 9,    # INFO
                                "severityText": "INFO",
                                "traceId": trace_id,
                                "spanId": span_id,
                                "body": {
                                    "stringValue": (
                                        f"chat request: model={MODEL} "
                                        f"input_tokens={input_tokens} "
                                        f"output_tokens={output_tokens} "
                                        f"latency_ms={latency_ms:.0f} "
                                        f"status={status_code}"
                                    )
                                },
                                "attributes": [
                                    {"key": "gen_ai.system",
                                     "value": {"stringValue": "anthropic"}},
                                    {"key": "gen_ai.request.model",
                                     "value": {"stringValue": MODEL}},
                                    {"key": "gen_ai.usage.input_tokens",
                                     "value": {"intValue": str(input_tokens)}},
                                    {"key": "gen_ai.usage.output_tokens",
                                     "value": {"intValue": str(output_tokens)}},
                                    {"key": "gen_ai.usage.cache_read_tokens",
                                     "value": {"intValue": str(cache_read_tokens)}},
                                    {"key": "gen_ai.usage.total_tokens",
                                     "value": {"intValue": str(total_tokens)}},
                                    {"key": "gen_ai.request.latency_ms",
                                     "value": {"doubleValue": latency_ms}},
                                    {"key": "http.status_code",
                                     "value": {"intValue": str(status_code)}},
                                    {"key": "gen_ai.prompt.preview",
                                     "value": {"stringValue": user_message_preview}},
                                ],
                            }
                        ],
                    }
                ],
            }
        ]
    }

    headers = {"Content-Type": "application/json"}
    token = get_otel_token()
    if token:
        headers["X-OTel-Token"] = token

    try:
        requests.post(
            f"{OTEL_ENDPOINT}/v1/logs",
            json=payload,
            headers=headers,
            timeout=3.0,
        )
    except Exception as e:
        print(f"[WARN] OTel logs push failed (non-fatal): {e}")


# ---------------------------------------------------------------------------
# Budget helpers
# ---------------------------------------------------------------------------
def today_key() -> str:
    # Encode date into pk so no sort key is needed — matches table schema (pk only)
    date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return f"budget:{date}"


def get_tokens_used_today() -> int:
    try:
        resp = budget_table.get_item(Key={"pk": today_key()})
        return int(resp.get("Item", {}).get("tokens_used", 0))
    except ClientError:
        return 0


def increment_token_count(tokens: int) -> None:
    try:
        # TTL: expire 48h after midnight UTC of the current day
        expire_at = int(
            (datetime.now(timezone.utc).replace(
                hour=0, minute=0, second=0, microsecond=0
            ).timestamp()) + 172800  # 48 hours in seconds
        )
        budget_table.update_item(
            Key={"pk": today_key()},
            UpdateExpression="ADD tokens_used :t SET #ttl = if_not_exists(#ttl, :exp)",
            ExpressionAttributeNames={"#ttl": "ttl"},
            ExpressionAttributeValues={":t": tokens, ":exp": expire_at},
        )
    except ClientError as e:
        print(f"[WARN] Failed to increment token count: {e}")


def budget_exhausted_response() -> dict:
    return {
        "statusCode": 429,
        "headers": cors_headers(),
        "body": json.dumps({
            "message": (
                "Today's chat quota has been reached — this is a portfolio demo with a "
                "small daily token budget to keep costs manageable. Check back tomorrow, "
                "or explore the live Grafana dashboard at grafana.creechlabs.dev."
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


def trim_messages(messages: list) -> list:
    if len(messages) > MAX_MESSAGES:
        return messages[-MAX_MESSAGES:]
    return messages


# ---------------------------------------------------------------------------
# Main handler
# ---------------------------------------------------------------------------
def handler(event: dict, context) -> dict:
    start_time = time.time()
    start_ns   = int(start_time * 1e9)

    # ── OPTIONS preflight ──────────────────────────────────────────────────
    if event.get("requestContext", {}).get("http", {}).get("method") == "OPTIONS":
        return {"statusCode": 204, "headers": cors_headers(), "body": ""}

    # ── Parse body ─────────────────────────────────────────────────────────
    try:
        body     = json.loads(event.get("body") or "{}")
        messages = body.get("messages", [])
        if not messages or not isinstance(messages, list):
            return error_response(400, "messages array is required")
    except (json.JSONDecodeError, TypeError):
        return error_response(400, "Invalid JSON body")

    for msg in messages:
        if msg.get("role") not in ("user", "assistant") or not msg.get("content"):
            return error_response(400, "Each message must have role and content")

    # ── Budget check ───────────────────────────────────────────────────────
    tokens_today = get_tokens_used_today()
    if tokens_today >= DAILY_TOKEN_CAP:
        print(f"[INFO] Budget exhausted: {tokens_today}/{DAILY_TOKEN_CAP}")
        return budget_exhausted_response()

    # ── Check collector availability (non-blocking) ────────────────────────
    collector_available = check_collector_health()
    if not collector_available:
        print("[INFO] OTel collector unreachable — instrumentation degraded")

    # ── Trace/span IDs (generated regardless, used if collector is up) ─────
    trace_id = generate_trace_id()
    span_id  = generate_span_id()

    # ── Build request ──────────────────────────────────────────────────────
    messages = trim_messages(messages)
    user_message = next(
        (m["content"] for m in reversed(messages) if m["role"] == "user"), ""
    )

    system_with_cache = [
        {
            "type": "text",
            "text": SYSTEM_PROMPT,
            "cache_control": {"type": "ephemeral"},
        }
    ]

    # ── Call Anthropic API ─────────────────────────────────────────────────
    status_code = 200
    try:
        client = anthropic.Anthropic(api_key=get_api_key())

        response = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=system_with_cache,
            messages=messages,
        )

        reply_text = "".join(
            block.text for block in response.content if block.type == "text"
        )

        usage            = response.usage
        input_tokens     = usage.input_tokens
        output_tokens    = usage.output_tokens
        cache_read       = getattr(usage, "cache_read_input_tokens", 0)
        cache_write      = getattr(usage, "cache_creation_input_tokens", 0)
        total_tokens     = input_tokens + output_tokens
        latency_ms       = (time.time() - start_time) * 1000
        end_ns           = int(time.time() * 1e9)

        print(
            f"[INFO] tokens: input={input_tokens} output={output_tokens} "
            f"cache_read={cache_read} cache_write={cache_write} "
            f"latency_ms={latency_ms:.0f} model={MODEL} "
            f"collector_available={collector_available} "
            f"trace_id={trace_id}"
        )

        increment_token_count(total_tokens)

        # ── OTel push (non-blocking, best-effort) ──────────────────────────
        if collector_available:
            msg_preview = user_message[:100] + "..." if len(user_message) > 100 else user_message
            emit_otlp_trace(
                trace_id, span_id, start_ns, end_ns,
                status_code, input_tokens, output_tokens,
                cache_read, total_tokens, user_message,
            )
            emit_otlp_metrics(
                input_tokens, output_tokens, cache_read,
                total_tokens, latency_ms,
            )
            emit_otlp_logs(
                trace_id, span_id, end_ns,
                input_tokens, output_tokens, cache_read,
                total_tokens, latency_ms, status_code,
                msg_preview,
            )

        return {
            "statusCode": 200,
            "headers": cors_headers(),
            "body": json.dumps({
                "reply": reply_text,
                "usage": {
                    "input_tokens":       input_tokens,
                    "output_tokens":      output_tokens,
                    "cache_read_tokens":  cache_read,
                    "cache_write_tokens": cache_write,
                    "total_tokens":       total_tokens,
                },
                "model":   MODEL,
                "trace_id": trace_id,   # expose for UI to show "view trace" link
                "tokens_remaining_today": max(
                    0, DAILY_TOKEN_CAP - tokens_today - total_tokens
                ),
                "instrumented": collector_available,
            }),
        }

    except anthropic.APIStatusError as e:
        status_code = 502
        print(f"[ERROR] Anthropic API error: {e.status_code} {e.message}")
        return error_response(502, "Upstream AI service error — please try again")

    except anthropic.APIConnectionError as e:
        status_code = 502
        print(f"[ERROR] Anthropic connection error: {e}")
        return error_response(502, "Could not reach AI service — please try again")

    except Exception as e:
        status_code = 500
        print(f"[ERROR] Unexpected error: {e}")
        return error_response(500, "Internal server error")