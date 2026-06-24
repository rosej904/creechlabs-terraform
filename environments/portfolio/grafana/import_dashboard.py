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

    if "spec" in spec and "kind" in spec:
        # Already wrapped - extract just the spec body
        spec = spec["spec"]

    payload = {
        "apiVersion": "dashboard.grafana.app/v2",
        "kind": "Dashboard",
        "metadata": {
            "name": "demo-pub",
            "namespace": f"org-{org_id}"
        },
        "spec": spec
    }

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

    dashboard_url = f"/apis/dashboard.grafana.app/v2/namespaces/org-{org_id}/dashboards"
    status, body = api_call("POST", dashboard_url, data=payload)
    print(f"POST dashboard: HTTP {status}")

    if status in (200, 201):
        print("Dashboard imported successfully")
        api_call("POST", "/api/user/using/1")
        sys.exit(0)
    elif status == 409:
        print("Dashboard already exists, updating via PUT...")
        status2, body2 = api_call("PUT", f"{dashboard_url}/demo-pub", data=payload)
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
