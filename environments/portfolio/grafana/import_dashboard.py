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

    if org_id != "default":
        org_id = f"org-{org_id}"

    with open(dashboard_path, "r") as f:
        spec = json.load(f)

    # Strip envelope if already wrapped
    if "spec" in spec and "kind" in spec:
        spec = spec["spec"]

    payload = {
        "apiVersion": "dashboard.grafana.app/v2",
        "kind": "Dashboard",
        "metadata": {
            "name": "demo-pub",
            "namespace": f"{org_id}"
        },
        "spec": spec
    }

    def api_call(method, path, data=None, org_id_header=None):
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Basic {credentials}",
        }
        if org_id_header:
            headers["X-Grafana-Org-Id"] = org_id_header
        req = urllib.request.Request(
            f"{grafana_url}{path}",
            data=json.dumps(data).encode("utf-8") if data else None,
            headers=headers,
            method=method
        )
        try:
            with urllib.request.urlopen(req) as resp:
                return resp.status, resp.read().decode()
        except urllib.error.HTTPError as e:
            return e.code, e.read().decode()

    def set_permissions():
        perm_status, perm_body = api_call(
            "POST",
            "/api/dashboards/uid/demo-pub/permissions",
            data={"items": [
                {"role": "Viewer", "permission": 1},
                {"role": "Editor", "permission": 2}
            ]},
            org_id_header=org_id
        )
        print(f"Set dashboard permissions: HTTP {perm_status}")
        if perm_status not in (200, 204):
            print(f"WARNING: Could not set dashboard permissions: {perm_body}")

    # ----------------------------------------------------------------
    # Import dashboard
    # ----------------------------------------------------------------
    dashboard_url = f"/apis/dashboard.grafana.app/v2/namespaces/{org_id}/dashboards"
    status, body = api_call("POST", dashboard_url, data=payload)
    print(f"POST dashboard: HTTP {status}")

    if status in (200, 201):
        print("Dashboard imported successfully")
        set_permissions()
        sys.exit(0)

    elif status == 409:
        print("Dashboard already exists, updating via PUT...")
        status2, body2 = api_call("PUT", f"{dashboard_url}/demo-pub", data=payload)
        print(f"PUT dashboard: HTTP {status2}")
        if status2 in (200, 201):
            print("Dashboard updated successfully")
            set_permissions()
            sys.exit(0)
        else:
            print(f"PUT failed: {body2}")
            sys.exit(1)

    else:
        print(f"ERROR: {body}")
        sys.exit(1)

if __name__ == "__main__":
    main()