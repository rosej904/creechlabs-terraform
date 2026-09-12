"""
Handler for POST /api/demo-request.

Deploys as its own function (cl-portfolio-demo-request), NOT merged into the
status checker — that role carries broad account read access and this is an
unauthenticated public write path.

Lives at lambda/demo_request/index.py to match the status_checker layout.
Set DEMO_REQUEST_ENDPOINT = '/api/demo-request' in src/config/demoMode.js to
switch the frontend off the mailto fallback.
"""

import json
import os
import re
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError

ses = boto3.client("sesv2")

FROM_ADDRESS = os.environ["SES_FROM_ADDRESS"]
NOTIFY_EMAIL = os.environ["DEMO_NOTIFY_EMAIL"]
CONFIG_SET = os.environ.get("SES_CONFIGURATION_SET")

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
MAX_FIELD = 2000


def _clean(value, limit=200):
    """Trim, cap length, and strip CR/LF so nothing can inject mail headers."""
    if not isinstance(value, str):
        return ""
    return value.replace("\r", " ").replace("\n", " ").strip()[:limit]


def _response(code, body):
    return {
        "statusCode": code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }


def handler(event, context):
    try:
        payload = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return _response(400, {"error": "Malformed JSON"})

    name = _clean(payload.get("name"))
    email = _clean(payload.get("email"))
    company = _clean(payload.get("company"))
    note = _clean(payload.get("note"), MAX_FIELD)

    if not name:
        return _response(400, {"error": "Name is required"})
    if not EMAIL_RE.match(email):
        return _response(400, {"error": "Valid email is required"})

    # /api/* is proxied through CloudFront, so requestContext sourceIp is a
    # CloudFront edge address, not the visitor. CloudFront appends the real
    # client to X-Forwarded-For; the first entry is the viewer.
    headers = event.get("headers", {}) or {}
    xff = headers.get("x-forwarded-for", "")
    src_ip = (
        xff.split(",")[0].strip()
        or event.get("requestContext", {}).get("http", {}).get("sourceIp", "unknown")
    )
    user_agent = _clean(headers.get("user-agent", "unknown"), 300)
    received = datetime.now(timezone.utc).isoformat(timespec="seconds")

    subject = f"Demo request — {name}" + (f" ({company})" if company else "")
    text_body = "\n".join(
        [
            f"Name:    {name}",
            f"Email:   {email}",
            f"Company: {company or '—'}",
            "",
            "Message:",
            note or "(none)",
            "",
            "—" * 20,
            f"Received: {received}",
            f"Source IP: {src_ip}",
            f"User agent: {user_agent}",
        ]
    )

    kwargs = {
        "FromEmailAddress": FROM_ADDRESS,
        "Destination": {"ToAddresses": [NOTIFY_EMAIL]},
        # Reply goes straight to the requester — just hit reply in your client.
        "ReplyToAddresses": [email],
        "Content": {
            "Simple": {
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {"Text": {"Data": text_body, "Charset": "UTF-8"}},
            }
        },
    }
    if CONFIG_SET:
        kwargs["ConfigurationSetName"] = CONFIG_SET

    try:
        ses.send_email(**kwargs)
    except ClientError as exc:
        code = exc.response["Error"]["Code"]
        print(f"SES send failed: {code} — {exc}")
        return _response(502, {"error": "Could not send the request"})

    return _response(200, {"ok": True})
