      DASHBOARD_JSON=$(cat '${path.module}/dashboard.json')
      HTTP_STATUS=$(curl -s -o /tmp/dashboard_result.json -w "%%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "X-Grafana-Org-Id: ${grafana_organization.public.org_id}" \
        -u 'admin:${var.grafana_admin_password}' \
        '${var.grafana_url}/api/dashboards/db' \
        -d "{\"dashboard\": $${DASHBOARD_JSON}, \"overwrite\": true, \"folderId\": 0}")
      echo "HTTP Status: $${HTTP_STATUS}"
      cat /tmp/dashboard_result.json
      if [ "$${HTTP_STATUS}" != "200" ]; then
        echo "ERROR: Dashboard import failed with HTTP $${HTTP_STATUS}"
        exit 1
      fi