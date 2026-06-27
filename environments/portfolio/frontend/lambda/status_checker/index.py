"""
creechlabs portfolio status checker + resource summary.

Routes:
  GET /api/status    -> EKS + app health summary
  GET /api/resources -> live resource counts + 30-day costs
"""

import json
import os
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta

import boto3

EKS_CLUSTER_NAME = os.environ["EKS_CLUSTER_NAME"]
STATUS_TARGETS    = json.loads(os.environ["STATUS_CHECK_TARGETS"])
AWS_REGION        = os.environ.get("AWS_REGION", "us-east-1")

HTTP_TIMEOUT_SECONDS = 4

eks_client    = boto3.client("eks")
ec2_client    = boto3.client("ec2")
elb_client    = boto3.client("elbv2")
s3_client     = boto3.client("s3")
lambda_client = boto3.client("lambda")
apigw_client  = boto3.client("apigatewayv2")
cf_client     = boto3.client("cloudfront")
cb_client     = boto3.client("codebuild")
eb_client     = boto3.client("events")
asg_client    = boto3.client("autoscaling")
ce_client     = boto3.client("ce", region_name="us-east-1")


# ─── Status ───────────────────────────────────────────────────────────────────

def check_eks_cluster():
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


def build_status_body():
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
        "eks":  {"status": eks_status,     "detail": eks_detail},
        "apps": {"status": apps_aggregate, "detail": app_results},
    }


# ─── Resource counts + costs ──────────────────────────────────────────────────

def safe_count(fn):
    try:
        return fn()
    except Exception:
        return 0


def get_cost_by_service():
    today = datetime.now(timezone.utc).date()
    start = (today - timedelta(days=30)).isoformat()
    end   = today.isoformat()

    SERVICE_MAP = {
        "Amazon Elastic Compute Cloud - Compute": "EC2 instances (running)",
        "Amazon Elastic Kubernetes Service":       "EKS cluster",
        "Amazon Virtual Private Cloud":            "VPC",
        "Amazon Simple Storage Service":           "S3 buckets",
        "AWS Lambda":                              "Lambda functions",
        "Amazon API Gateway":                      "API Gateway",
        "Amazon CloudFront":                       "CloudFront",
        "Amazon EventBridge":                      "EventBridge",
        "AWS CodeBuild":                           "CodeBuild",
        "Elastic Load Balancing":                  "Application load balancer",
    }

    try:
        resp = ce_client.get_cost_and_usage(
            TimePeriod={"Start": start, "End": end},
            Granularity="MONTHLY",
            Metrics=["UnblendedCost"],
            GroupBy=[{"Type": "DIMENSION", "Key": "SERVICE"}],
        )
        costs = {}
        for result in resp.get("ResultsByTime", []):
            for group in result.get("Groups", []):
                svc_name = group["Keys"][0]
                amount   = float(group["Metrics"]["UnblendedCost"]["Amount"])
                label    = SERVICE_MAP.get(svc_name)
                if label and amount > 0:
                    costs[label] = round(costs.get(label, 0) + amount, 4)
        return costs
    except Exception:
        return {}


def build_resources_body():
    vpc_id = None
    try:
        vpcs   = ec2_client.describe_vpcs(
            Filters=[{"Name": "tag:Name", "Values": ["cl-portfolio-vpc"]}]
        ).get("Vpcs", [])
        vpc_id = vpcs[0]["VpcId"] if vpcs else None
    except Exception:
        pass

    def count_eks():
        status, _ = check_eks_cluster()
        return 1 if status == "up" else 0

    def count_ec2():
        r = ec2_client.describe_instances(
            Filters=[
                {"Name": f"tag:kubernetes.io/cluster/{EKS_CLUSTER_NAME}", "Values": ["owned"]},
                {"Name": "instance-state-name", "Values": ["running"]},
            ]
        )
        return sum(len(res["Instances"]) for res in r.get("Reservations", []))

    def count_asgs():
        asgs    = asg_client.describe_auto_scaling_groups().get("AutoScalingGroups", [])
        tag_key = f"kubernetes.io/cluster/{EKS_CLUSTER_NAME}"
        return len([a for a in asgs if any(t["Key"] == tag_key for t in a.get("Tags", []))])

    def count_albs():
        albs = elb_client.describe_load_balancers().get("LoadBalancers", [])
        return len([a for a in albs if a.get("VpcId") == vpc_id]) if vpc_id else len(albs)

    def count_tgs():
        albs  = elb_client.describe_load_balancers().get("LoadBalancers", [])
        total = 0
        for alb in albs:
            if vpc_id and alb.get("VpcId") != vpc_id:
                continue
            total += len(elb_client.describe_target_groups(
                LoadBalancerArn=alb["LoadBalancerArn"]
            ).get("TargetGroups", []))
        return total

    def count_subnets():
        if not vpc_id:
            return 0
        return len(ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        ).get("Subnets", []))

    def count_apigw():
        # Check both HTTP APIs (v2) and REST APIs (v1)
        http_apis = len(apigw_client.get_apis().get("Items", []))
        try:
            apigw_v1 = boto3.client("apigateway")
            rest_apis = len(apigw_v1.get_rest_apis().get("items", []))
        except Exception:
            rest_apis = 0
        return http_apis + rest_apis

    def count_cloudfront():
        items = cf_client.list_distributions().get("DistributionList", {}).get("Items", [])
        return len(items) if items else 0

    def count_eventbridge():
        return len(eb_client.list_rules().get("Rules", []))

    def count_codebuild():
        return len(cb_client.list_projects().get("projects", []))

    def count_lambdas():
        fns = lambda_client.list_functions().get("Functions", [])
        return len([f for f in fns if "cl-portfolio" in f["FunctionName"]])

    def count_s3():
        buckets = s3_client.list_buckets().get("Buckets", [])
        return len([b for b in buckets if b["Name"].startswith("cl-portfolio")])

    rows_spec = [
        ("EKS cluster",                 count_eks),
        ("EC2 instances (running)",     count_ec2),
        ("EC2 auto scaling groups",     count_asgs),
        ("Application load balancer",   count_albs),
        ("Load balancer target groups", count_tgs),
        ("VPC",                         lambda: 1 if vpc_id else 0),
        ("Subnets",                     count_subnets),
        ("API Gateway",                 count_apigw),
        ("CloudFront",                  count_cloudfront),
        ("EventBridge",                 count_eventbridge),
        ("CodeBuild",                   count_codebuild),
        ("Lambda functions",            count_lambdas),
        ("S3 buckets",                  count_s3),
    ]

    costs = get_cost_by_service()

    rows = []
    for label, fn in rows_spec:
        rows.append({
            "service":  label,
            "count":    safe_count(fn),
            "cost_30d": costs.get(label),
        })

    return {
        "status":     "ok",
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "resources":  rows,
    }


# ─── Router ───────────────────────────────────────────────────────────────────

def handler(event, context):
    path = event.get("rawPath") or event.get("path") or "/api/status"

    if path == "/api/resources":
        body = build_resources_body()
    else:
        body = build_status_body()

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type":  "application/json",
            "Cache-Control": "no-store",
        },
        "body": json.dumps(body),
    }