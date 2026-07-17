"""
cl-portfolio-chat Lambda handler
- Daily token budget enforced via DynamoDB
- Prompt caching on system prompt (90% cost reduction on cached input)
- OTel instrumentation: traces -> Tempo, metrics -> Prometheus, logs -> Loki
- Graceful degradation when otel collector is unreachable (cluster offline)
- Caller identity: single static frontend key, env-var based (no IdP needed
  since this Lambda has exactly one caller — the portfolio frontend widget.
  Future agent/service callers will route through LiteLLM proxy, not here.)
- MCP tool-use loop: Grafana MCP server for live metrics/alerts/dashboards
  Tools only offered when cluster is online (collector_available=True)
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
REGION              = os.environ.get("AWS_REGION", "us-east-1")
SECRET_ARN          = os.environ["ANTHROPIC_SECRET_ARN"]
BUDGET_TABLE        = os.environ["BUDGET_TABLE_NAME"]
DAILY_TOKEN_CAP     = int(os.environ.get("DAILY_TOKEN_CAP", "500000"))
MAX_MESSAGES        = int(os.environ.get("MAX_MESSAGES", "20"))
MODEL               = os.environ.get("CLAUDE_MODEL", "claude-haiku-4-5")
OTEL_ENDPOINT       = os.environ.get("OTEL_ENDPOINT", "https://otel.creechlabs.dev")
OTEL_SECRET_ARN     = os.environ.get("OTEL_SECRET_ARN", "")
FRONTEND_CALLER_KEY = os.environ.get("FRONTEND_CALLER_KEY", "")
MCP_ENDPOINT        = os.environ.get("MCP_ENDPOINT", "")
SERVICE_NAME        = "cl-portfolio-chat"
SERVICE_VERSION     = "1.0.0"
MAX_TOOL_ROUNDS     = 3

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


def get_caller_id(event: dict) -> str:
    """
    Identifies the calling service from the X-Caller-Key header.
    This Lambda has exactly one legitimate caller: the portfolio frontend.
    Any future agent/service callers will route through LiteLLM proxy
    (a separate path) and never reach this Lambda.

    - Header matches FRONTEND_CALLER_KEY -> cl-portfolio-frontend
    - Header missing (expected for make test / direct invokes) -> anonymous-public
    - Header present but wrong -> anonymous-public (attribution only, not auth)
    """
    if not FRONTEND_CALLER_KEY:
        return "anonymous-public"
    header_val = (event.get("headers") or {}).get("x-caller-key", "")
    if header_val and header_val == FRONTEND_CALLER_KEY:
        return "cl-portfolio-frontend"
    return "anonymous-public"


# ---------------------------------------------------------------------------
# MCP tool executor
# ---------------------------------------------------------------------------
def call_mcp_tool(tool_name: str, tool_input: dict) -> str:
    """
    Call a Grafana MCP tool via streamable-http transport.
    Each call initializes a fresh session — stateless, fits Lambda model.
    Retries up to 3 times on DNS/connection errors (common on Lambda cold starts).
    Returns tool result as a string for Claude to consume.
    """
    if not MCP_ENDPOINT:
        return "MCP server not configured"

    last_error = None
    for attempt in range(3):
        try:
            # Step 1: Initialize session, get session ID from response headers
            init_resp = requests.post(
                f"{MCP_ENDPOINT}/mcp",
                json={
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": "initialize",
                    "params": {
                        "protocolVersion": "2024-11-05",
                        "capabilities": {},
                        "clientInfo": {"name": SERVICE_NAME, "version": SERVICE_VERSION}
                    }
                },
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json, text/event-stream"
                },
                timeout=5.0
            )
            session_id = init_resp.headers.get("mcp-session-id", "")

            # Step 2: Call the tool with the session ID
            tool_resp = requests.post(
                f"{MCP_ENDPOINT}/mcp",
                json={
                    "jsonrpc": "2.0",
                    "id": 2,
                    "method": "tools/call",
                    "params": {"name": tool_name, "arguments": tool_input}
                },
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json, text/event-stream",
                    "mcp-session-id": session_id
                },
                timeout=10.0
            )
            result = tool_resp.json()

            # Extract text content from MCP response
            content = result.get("result", {}).get("content", [])
            if content:
                return "\n".join(c.get("text", "") for c in content if c.get("type") == "text")

            # Surface any error from the MCP server
            if "error" in result:
                return f"Tool error: {result['error'].get('message', 'unknown error')}"

            return "No result returned from tool"

        except requests.exceptions.ConnectionError as e:
            last_error = e
            print(f"[WARN] MCP connection error attempt {attempt + 1}/3 ({tool_name}): {e}")
            if attempt < 2:
                time.sleep(attempt + 1)  # 1s then 2s backoff
            continue

        except requests.Timeout:
            print(f"[WARN] MCP tool call timed out: {tool_name}")
            return "Tool call timed out — Grafana may be slow or offline"

        except Exception as e:
            print(f"[WARN] MCP tool call failed: {tool_name} error={e}")
            return f"Tool call failed: {e}"

    print(f"[WARN] MCP tool call failed after 3 attempts ({tool_name}): {last_error}")
    return "Tool temporarily unavailable — please try again"


# ---------------------------------------------------------------------------
# MCP tool definitions (what Claude sees — controls what Anri can query)
# ---------------------------------------------------------------------------
def build_mcp_tools() -> list:
    """
    Hardcoded tool schema passed to Claude with each request.
    Claude decides when to use these based on user intent.
    Only offered when cluster is online (caller checks collector_available).
    """
    return [
        {
            "name": "query_prometheus",
            "description": (
                "Execute a PromQL query against the live Prometheus datasource. "
                "Use for current metric values: error rates, latency percentiles, "
                "burn rates, node CPU/memory/disk, request rates, pod status. "
                "Good recording rules to use: service:burnrate5m, service:requests:rate5m, "
                "service:latency_p95:5m. Use queryType='instant' and endTime='now' for current values."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "datasourceUid": {
                        "type": "string",
                        "enum": ["prometheus"],
                        "description": "Always use the literal string 'prometheus'"
                    },
                    "expr": {
                        "type": "string",
                        "description": "PromQL expression e.g. service:burnrate5m or sum(rate(traces_spanmetrics_calls_total{status_code='STATUS_CODE_ERROR'}[5m]))"
                    },
                    "queryType": {
                        "type": "string",
                        "enum": ["instant", "range"],
                        "description": "Use 'instant' for current values"
                    },
                    "endTime": {
                        "type": "string",
                        "description": "End time — always use 'now' for current values"
                    }
                },
                "required": ["datasourceUid", "expr", "endTime"]
            }
        },
        {
            "name": "alerting_manage_rules",
            "description": (
                "List and inspect Grafana alert rules and their current firing state. "
                "Use when asked about alerts, incidents, system health, or SLO breaches. "
                "Always use operation='list'. Use states=['firing'] to see only active alerts."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "operation": {
                        "type": "string",
                        "enum": ["list"],
                        "description": "Always use 'list' to retrieve alert rules"
                    },
                    "states": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Filter by state: firing, pending, normal, recovering, nodata, error"
                    },
                    "limit_alerts": {
                        "type": "integer",
                        "description": "Max alert instances per rule — use 5 to keep response concise"
                    }
                },
                "required": ["operation"]
            }
        },
        {
            "name": "search_dashboards",
            "description": (
                "Search for Grafana dashboards by name. "
                "Use when asked about available dashboards or to find a specific one."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query e.g. 'Demo' or 'SRE'"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max results to return"
                    }
                }
            }
        },
        {
            "name": "query_loki_logs",
            "description": (
                "Query Loki for recent logs from a specific service. "
                "Use when asked about errors, recent log output, or service activity."
            ),
            "input_schema": {
                "type": "object",
                "properties": {
                    "datasourceUid": {
                        "type": "string",
                        "enum": ["loki"],
                        "description": "Always use the literal string 'loki'"
                    },
                    "logql": {
                        "type": "string",
                        "description": "LogQL query e.g. {k8s_deployment_name='checkout'} | json"
                    },
                    "startRfc3339": {
                        "type": "string",
                        "description": "Start time e.g. 'now-5m' or 'now-1h'"
                    },
                    "endRfc3339": {
                        "type": "string",
                        "description": "End time — use 'now'"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max log lines to return — use 20 for brevity"
                    }
                },
                "required": ["datasourceUid", "logql"]
            }
        }
    ]


# ---------------------------------------------------------------------------
# System prompt
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
- AWS EKS (K8s 1.36) in us-east-1 | t3.medium nodes | 1 on-demand instance node (for pods that require stability) & 1 spot instance group scaled by Auto Scaling Group (min 1, max 3).
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

## Live Data Capability
- You can query live Grafana metrics, alerts, logs, and dashboards using built-in tools when the cluster is online (weekdays ~8:30 AM–5 PM ET).
- Use these tools proactively when users ask about current system state, error rates, alerts, or service health.
- If a tool returns an error, report the specific error — do not assume the cluster is offline. The cluster status is determined by whether tools are available, not by whether a specific query succeeds.
- Empty tool results mean the specific query returned no data — not that the cluster is offline. Never conclude the cluster is offline based on an empty tool result. Only conclude the cluster is offline if tools are unavailable entirely.
- When a PromQL query returns no data, try a simpler query or report that the specific metric isn't available rather than concluding the system is down.

## Behavioral Rules
- Keep responses short, direct, and architecture-focused.
- If asked about live cluster state outside 8:30 AM–5:00 PM ET weekdays, note the cluster may still be coming up or already torn down.
- Do not hallucinate or guess infrastructure details — use tools for live data.
- When returning metric values, always include units and context (e.g. "checkout burn rate: 0.0x (healthy, SLO target 1.0x threshold)").
"""


# ---------------------------------------------------------------------------
# OTel helpers
# ---------------------------------------------------------------------------
def generate_trace_id() -> str:
    import secrets
    return secrets.token_hex(16)


def generate_span_id() -> str:
    import secrets
    return secrets.token_hex(8)


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
    caller_id: str,
    tool_calls_made: int = 0,
) -> None:
    """Push a single span to the OTel collector via OTLP/HTTP."""

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
                                "kind": 2,
                                "startTimeUnixNano": str(start_ns),
                                "endTimeUnixNano": str(end_ns),
                                "status": {
                                    "code": 1 if status_code == 200 else 2
                                },
                                "attributes": [
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
                                    {"key": "http.status_code",
                                     "value": {"intValue": str(status_code)}},
                                    {"key": "gen_ai.prompt.preview",
                                     "value": {"stringValue": msg_preview}},
                                    {"key": "gen_ai.caller.id",
                                     "value": {"stringValue": caller_id}},
                                    {"key": "gen_ai.tool_calls",
                                     "value": {"intValue": str(tool_calls_made)}},
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
    cumulative_daily_tokens: int | None,
    caller_id: str,
    tool_calls_made: int = 0,
) -> None:
    """
    Push two metric shapes to the OTel collector:
    - Gauges: per-request snapshots (latency, this request's token counts).
      Tagged with caller_id since these genuinely reflect this caller's request.
    - Counter: cumulative daily total, sourced from DynamoDB so Prometheus and
      the budget ledger never disagree. NOT tagged with caller_id.
    """

    now_ns = str(int(time.time() * 1e9))
    common_attrs = [
        {"key": "service.name", "value": {"stringValue": SERVICE_NAME}},
        {"key": "gen_ai.system", "value": {"stringValue": "anthropic"}},
        {"key": "gen_ai.request.model", "value": {"stringValue": MODEL}},
    ]
    per_request_attrs = common_attrs + [
        {"key": "gen_ai.caller.id", "value": {"stringValue": caller_id}},
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

    def counter(name: str, description: str, value: float, attrs: list) -> dict:
        return {
            "name": name,
            "description": description,
            "sum": {
                "dataPoints": [
                    {
                        "attributes": attrs,
                        "timeUnixNano": now_ns,
                        "asDouble": value,
                    }
                ],
                "aggregationTemporality": 2,
                "isMonotonic": True,
            },
        }

    metrics = [
        gauge("gen_ai.usage.input_tokens",
              "Input tokens for this request",
              input_tokens, per_request_attrs),
        gauge("gen_ai.usage.output_tokens",
              "Output tokens for this request",
              output_tokens, per_request_attrs),
        gauge("gen_ai.usage.cache_read_tokens",
              "Cache read tokens for this request",
              cache_read_tokens, per_request_attrs),
        gauge("gen_ai.usage.total_tokens",
              "Total tokens for this request",
              total_tokens, per_request_attrs),
        gauge("gen_ai.request.latency_ms",
              "End-to-end chat request latency in ms",
              latency_ms, per_request_attrs),
        gauge("gen_ai.tool_calls",
              "Number of MCP tool calls made in this request",
              tool_calls_made, per_request_attrs),
    ]

    if cumulative_daily_tokens is not None:
        metrics.append(
            counter("gen_ai.usage.total_tokens_today",
                    "Cumulative tokens used today (resets daily, sourced from budget ledger)",
                    cumulative_daily_tokens, common_attrs)
        )

    payload = {
        "resourceMetrics": [
            {
                "resource": {
                    "attributes": [
                        {"key": "service.name",
                         "value": {"stringValue": SERVICE_NAME}},
                        {"key": "cloud.provider",
                         "value": {"stringValue": "aws"}},
                        {"key": "service.source",
                         "value": {"stringValue": "lambda-external"}},
                    ]
                },
                "scopeMetrics": [
                    {
                        "scope": {"name": SERVICE_NAME},
                        "metrics": metrics,
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
    caller_id: str,
    tool_calls_made: int = 0,
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
                                "severityNumber": 9,
                                "severityText": "INFO",
                                "traceId": trace_id,
                                "spanId": span_id,
                                "body": {
                                    "stringValue": (
                                        f"chat request: caller={caller_id} "
                                        f"model={MODEL} "
                                        f"input_tokens={input_tokens} "
                                        f"output_tokens={output_tokens} "
                                        f"latency_ms={latency_ms:.0f} "
                                        f"status={status_code} "
                                        f"tool_calls={tool_calls_made}"
                                    )
                                },
                                "attributes": [
                                    {"key": "gen_ai.caller.id",
                                     "value": {"stringValue": caller_id}},
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
                                    {"key": "gen_ai.tool_calls",
                                     "value": {"intValue": str(tool_calls_made)}},
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
    date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return f"budget:{date}"


def get_tokens_used_today() -> int:
    try:
        resp = budget_table.get_item(Key={"pk": today_key()})
        return int(resp.get("Item", {}).get("tokens_used", 0))
    except ClientError:
        return 0


def increment_token_count(tokens: int) -> int | None:
    """Returns the new cumulative daily total, or None if the update failed."""
    try:
        resp = budget_table.update_item(
            Key={"pk": today_key()},
            UpdateExpression="ADD tokens_used :t",
            ExpressionAttributeValues={":t": tokens},
            ReturnValues="UPDATED_NEW",
        )
        return int(resp.get("Attributes", {}).get("tokens_used", 0))
    except ClientError as e:
        print(f"[WARN] Failed to increment token count: {e}")
        return None


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

    # ── Resolve caller identity ────────────────────────────────────────────
    caller_id = get_caller_id(event)

    # ── Budget check ───────────────────────────────────────────────────────
    tokens_today = get_tokens_used_today()
    if tokens_today >= DAILY_TOKEN_CAP:
        print(f"[INFO] Budget exhausted: {tokens_today}/{DAILY_TOKEN_CAP}")
        return budget_exhausted_response()

    # ── Check collector availability (non-blocking) ────────────────────────
    collector_available = check_collector_health()
    if not collector_available:
        print("[INFO] OTel collector unreachable — instrumentation degraded, MCP tools disabled")

    # ── Trace/span IDs ────────────────────────────────────────────────────
    trace_id = generate_trace_id()
    span_id  = generate_span_id()

    # ── Build request ─────────────────────────────────────────────────────
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

    # ── MCP tools — only when cluster is online ───────────────────────────
    mcp_tools = build_mcp_tools() if (MCP_ENDPOINT and collector_available) else []

    # ── Call Anthropic API (with MCP tool-use loop) ────────────────────────
    status_code     = 200
    tool_calls_made = 0

    try:
        client = anthropic.Anthropic(api_key=get_api_key())

        create_kwargs = dict(
            model=MODEL,
            max_tokens=1024,
            system=system_with_cache,
            messages=messages,
        )
        if mcp_tools:
            create_kwargs["tools"] = mcp_tools

        response = client.messages.create(**create_kwargs)

        # ── Tool-use loop (max MAX_TOOL_ROUNDS to prevent runaway) ─────────
        loop_messages = list(messages)

        while response.stop_reason == "tool_use" and tool_calls_made < MAX_TOOL_ROUNDS:
            tool_calls_made += 1
            tool_results = []

            for block in response.content:
                if block.type == "tool_use":
                    print(f"[INFO] MCP tool call #{tool_calls_made}: {block.name} input={block.input}")
                    result_text = call_mcp_tool(block.name, block.input)
                    print(f"[INFO] MCP tool result ({block.name}): {result_text[:200]}")
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result_text
                    })

            # Append assistant turn + tool results, continue conversation
            loop_messages.append({"role": "assistant", "content": response.content})
            loop_messages.append({"role": "user", "content": tool_results})

            response = client.messages.create(
                model=MODEL,
                max_tokens=1024,
                system=system_with_cache,
                messages=loop_messages,
                tools=mcp_tools,
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
            f"tool_calls={tool_calls_made} "
            f"collector_available={collector_available} "
            f"caller_id={caller_id} "
            f"trace_id={trace_id}"
        )

        cumulative_daily_tokens = increment_token_count(total_tokens)

        # ── OTel push (non-blocking, best-effort) ─────────────────────────
        if collector_available:
            msg_preview = user_message[:100] + "..." if len(user_message) > 100 else user_message
            emit_otlp_trace(
                trace_id, span_id, start_ns, end_ns,
                status_code, input_tokens, output_tokens,
                cache_read, total_tokens, user_message,
                caller_id, tool_calls_made,
            )
            emit_otlp_metrics(
                input_tokens, output_tokens, cache_read,
                total_tokens, latency_ms, cumulative_daily_tokens,
                caller_id, tool_calls_made,
            )
            emit_otlp_logs(
                trace_id, span_id, end_ns,
                input_tokens, output_tokens, cache_read,
                total_tokens, latency_ms, status_code,
                msg_preview, caller_id, tool_calls_made,
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
                "model":      MODEL,
                "trace_id":   trace_id,
                "tool_calls": tool_calls_made,
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


def check_collector_health() -> bool:
    try:
        resp = requests.get(
            f"{OTEL_ENDPOINT}/",
            timeout=1.5,
            headers={"X-Health-Check": "true"},
        )
        print(f"[INFO] Collector health check: {resp.status_code}")
        return resp.status_code < 500
    except Exception as e:
        print(f"[INFO] Collector health check failed: {e}")
        return False
