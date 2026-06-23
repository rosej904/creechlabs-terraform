#!/usr/bin/env python3
"""
Import a Grafana v2 schema dashboard into a specific org.
Usage: python3 import_dashboard.py <grafana_url> <org_id> <admin_user> <admin_password> <dashboard_json_path>
"""
import json
import sys
import urllib.request
import urllib.error
import base64

def main():
    if len(sys.argv) != 6:
        print(f"Usage: {sys.argv[0]} <grafana_url> <org_id> <admin_user> <admin_password> <dashboard_json_path>")
        sys.exit(1)

    grafana_url    = sys.argv[1].rstrip("/")
    org_id         = sys.argv[2]
    admin_user     = sys.argv[3]
    admin_pass     = sys.argv[4]
    dashboard_path = sys.argv[5]

    credentials = base64.b64encode(f"{admin_user}:{admin_pass}".encode()).decode()

    with open(dashboard_path, "r") as f:
        spec = json.load(f)

    def api_call(method, path, data=None):
        req = urllib.request.Request(
            f"{grafana_url}{path}",
            data=json.dumps(data).encode("utf-8") if data else None,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Basic {credentials}",
            },
            method=method
        )
        try:
            with urllib.request.urlopen(req) as resp:
                return resp.status, resp.read().decode()
        except urllib.error.HTTPError as e:
            return e.code, e.read().decode()

    # Step 1: Switch admin user context to target org
    status, body = api_call("POST", f"/api/user/using/{org_id}")
    print(f"Switch to org {org_id}: HTTP {status}")
    if status != 200:
        print(f"ERROR: Could not switch org: {body}")
        sys.exit(1)

    # Step 2: POST dashboard (now in org 2 context)
    dashboard_url = "/apis/dashboard.grafana.app/v2/namespaces/default/dashboards"
    status, body = api_call("POST", dashboard_url, data=spec)
    print(f"POST dashboard: HTTP {status}")

    if status in (200, 201):
        print("Dashboard imported successfully")
        api_call("POST", "/api/user/using/1")
        sys.exit(0)
    elif status == 409:
        print("Dashboard already exists, updating via PUT...")
        status2, body2 = api_call("PUT", f"{dashboard_url}/demo-pub", data=spec)
        print(f"PUT dashboard: HTTP {status2}")
        if status2 in (200, 201):
            print("Dashboard updated successfully")
            api_call("POST", "/api/user/using/1")
            sys.exit(0)
        else:
            print(f"PUT failed: {body2}")
            api_call("POST", "/api/user/using/1")
            sys.exit(1)
    else:
        print(f"ERROR: {body}")
        api_call("POST", "/api/user/using/1")
        sys.exit(1)

if __name__ == "__main__":
    main()
