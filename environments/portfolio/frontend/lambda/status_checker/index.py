"""
creechlabs portfolio status checker.

Returns a high-level health summary for the portfolio infra so the
frontend can render a simple status indicator without exposing AWS
credentials to the browser.

Status values per resource:
  "up"        -> green  -> fully healthy / reachable
  "stopped"   -> blue   -> intentionally offline (nightly destroy cycle)
  "down"      -> red    -> expected to be up, but failing

We only ever surface two coarse resources to the frontend: "eks" and
"apps" (an aggregate of argocd/grafana/otel-demo). Internally we check
each app individually so we can decide "stopped" vs "down" with more
confidence, then roll them up.
"""

import json
import os
import urllib.request
import urllib.error

import boto3

EKS_CLUSTER_NAME = os.environ["EKS_CLUSTER_NAME"]
STATUS_TARGETS = json.loads(os.environ["STATUS_CHECK_TARGETS"])  # {name: url}

HTTP_TIMEOUT_SECONDS = 4

eks_client = boto3.client("eks")


def check_eks_cluster():
    """
    Returns ("up" | "stopped" | "down", detail_dict)

    EKS clusters in this project are fully destroyed (not just scaled
    down) during the nightly cycle, so DescribeCluster will throw
    ResourceNotFoundException when it's "stopped" rather than report
    an inactive state.
    """
    try:
        resp = eks_client.describe_cluster(name=EKS_CLUSTER_NAME)
        cluster_status = resp["cluster"]["status"]
        if cluster_status == "ACTIVE":
            return "up", {"clusterStatus": cluster_status}
        if cluster_status in ("CREATING", "UPDATING"):
            return "stopped", {"clusterStatus": cluster_status}
        return "down", {"clusterStatus": cluster_status}
    except eks_client.exceptions.ResourceNotFoundException:
        return "stopped", {"clusterStatus": "NOT_FOUND"}
    except Exception as exc: 
        return "down", {"error": str(exc)}


def check_http_target(name, url):
    """
    Returns ("up" | "down", detail_dict) for a single HTTP-reachable app.

    We don't distinguish "stopped" at the per-app level here -- if EKS
    itself is confirmed stopped, the caller treats all apps as stopped
    regardless of what this returns, since they can't possibly be up
    without the cluster.
    """
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT_SECONDS) as resp:
            if 200 <= resp.status < 400:
                return "up", {"httpStatus": resp.status}
            return "down", {"httpStatus": resp.status}
    except urllib.error.HTTPError as exc:
        if 400 <= exc.code < 500:
            return "up", {"httpStatus": exc.code}
        return "down", {"httpStatus": exc.code}
    except Exception as exc:
        return "down", {"error": str(exc)}


def build_response_body():
    eks_status, eks_detail = check_eks_cluster()

    app_results = {}
    for name, url in STATUS_TARGETS.items():
        if eks_status == "stopped":
            app_results[name] = {"status": "stopped", "detail": {"reason": "eks_stopped"}}
            continue

        status, detail = check_http_target(name, url)
        app_results[name] = {"status": status, "detail": detail}

    app_statuses = [r["status"] for r in app_results.values()]
    if all(s == "stopped" for s in app_statuses):
        apps_aggregate = "stopped"
    elif any(s == "down" for s in app_statuses):
        apps_aggregate = "down"
    else:
        apps_aggregate = "up"

    return {
        "eks": {"status": eks_status, "detail": eks_detail},
        "apps": {"status": apps_aggregate, "detail": app_results},
    }


def handler(event, context): 
    body = build_response_body()

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
        },
        "body": json.dumps(body),
    }
