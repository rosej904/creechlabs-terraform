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

    grafana_url  = sys.argv[1].rstrip("/")
    org_id       = sys.argv[2]
    admin_user   = sys.argv[3]
    admin_pass   = sys.argv[4]
    dashboard_path = sys.argv[5]

    # Load dashboard spec
    with open(dashboard_path, "r") as f:
        spec = json.load(f)

    # Wrap in v2 envelope
    envelope = {
        "apiVersion": "dashboard.grafana.app/v2",
        "kind": "Dashboard",
        "metadata": {
            "name": "demo-pub",
            "namespace": "default"
        },
        "spec": spec
    }

    payload = json.dumps(envelope).encode("utf-8")

    # Build request
    url = f"{grafana_url}/apis/dashboard.grafana.app/v2/namespaces/default/dashboards"
    credentials = base64.b64encode(f"{admin_user}:{admin_pass}".encode()).decode()

    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Basic {credentials}",
            "X-Grafana-Org-Id": org_id,
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode()
            print(f"HTTP Status: {resp.status}")
            print(body)
            print("Dashboard imported successfully")
            sys.exit(0)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"HTTP Status: {e.code}")
        print(body)
        # 409 Conflict = already exists, try PUT to update
        if e.code == 409:
            print("Dashboard already exists, attempting update via PUT...")
            req2 = urllib.request.Request(
                f"{url}/demo-pub",
                data=payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Basic {credentials}",
                    "X-Grafana-Org-Id": org_id,
                },
                method="PUT"
            )
            try:
                with urllib.request.urlopen(req2) as resp2:
                    body2 = resp2.read().decode()
                    print(f"PUT HTTP Status: {resp2.status}")
                    print(body2)
                    print("Dashboard updated successfully")
                    sys.exit(0)
            except urllib.error.HTTPError as e2:
                print(f"PUT failed: {e2.code} {e2.read().decode()}")
                sys.exit(1)
        sys.exit(1)

if __name__ == "__main__":
    main()
