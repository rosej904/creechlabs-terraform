terraform {
  required_providers {
    grafana = {
      source  = "grafana/grafana"
      version = "~> 3.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }

  backend "s3" {}
}

provider "grafana" {
  url  = var.grafana_url
  auth = "admin:${var.ui_admin_password}"
}

# ============================================================
# Org 2 — Public (anonymous viewer access)
# ============================================================

resource "grafana_organization" "public" {
  name = "Public"
}

# Provider alias scoped to org 2 for all resources below
provider "grafana" {
  alias  = "public_org"
  url    = var.grafana_url
  auth   = "admin:${var.ui_admin_password}"
  org_id = grafana_organization.public.org_id
}

# ============================================================
# Datasources — Org 2
# Same endpoints as org 1, separate UIDs, scoped to org 2
# ============================================================

resource "grafana_data_source" "prometheus_pub" {
  provider = grafana.public_org
  org_id   = grafana_organization.public.org_id
  name     = "prometheus"
  type     = "prometheus"
  uid      = "prometheus-pub"
  url      = var.prometheus_url
  is_default = true
}

resource "grafana_data_source" "loki_pub" {
  provider = grafana.public_org
  org_id   = grafana_organization.public.org_id
  name     = "loki"
  type     = "loki"
  uid      = "loki-pub"
  url      = var.loki_url

  json_data_encoded = jsonencode({
    derivedFields = [
      {
        name          = "TraceID"
        matcherType   = "label"
        matcherRegex  = "trace_id"
        datasourceUid = "tempo-pub"
        url           = "$${__value.raw}"
      }
    ]
  })
}

resource "grafana_data_source" "tempo_pub" {
  provider = grafana.public_org
  org_id   = grafana_organization.public.org_id
  name     = "tempo"
  type     = "tempo"
  uid      = "tempo-pub"
  url      = var.tempo_url

  json_data_encoded = jsonencode({
    httpMethod = "POST"
    serviceMap = {
      datasourceUid = "prometheus-pub"
    }
    tracesToLogsV2 = {
      datasourceUid     = "loki-pub"
      spanStartTimeShift = "-2m"
      spanEndTimeShift   = "2m"
      filterByTraceID    = false
      filterBySpanID     = false
      customQuery        = true
      query              = "{$${__tags}} | trace_id=\"$${__trace.traceId}\" | span_id=\"$${__span.spanId}\""
      tags = [
        {
          key   = "k8s.deployment.name"
          value = "k8s_deployment_name"
        }
      ]
    }
    tracesToMetrics = {
      datasourceUid = "prometheus-pub"
      tags = [
        {
          key   = "service.name"
          value = "service"
        }
      ]
      spanTimer = {
        metric = "traces_spanmetrics_latency_count"
      }
      queries = [
        {
          name  = "Average Latency"
          query = "sum(rate(traces_spanmetrics_latency_sum{$${__tags}}[5m])) by (service) / sum(rate(traces_spanmetrics_latency_count{$${__tags}}[5m])) by (service) * 1000"
        },
        {
          name  = "Request Rate"
          query = "sum(rate(traces_spanmetrics_calls_total{$${__tags}}[5m])) by (service)"
        }
      ]
    }
  })

  depends_on = [grafana_organization.public]
}

# ============================================================
# Alert Folders — Org 2
# Stable UIDs so dashboard Alert List panels always resolve
# ============================================================

resource "grafana_folder" "slo_alerts_pub" {
  provider = grafana.public_org
  org_id   = grafana_organization.public.org_id
  title    = "SLO Alerts"
  uid      = "slo-alerts-pub"
}

resource "grafana_folder" "resource_alerts_pub" {
  provider = grafana.public_org
  org_id   = grafana_organization.public.org_id
  title    = "Resource Alerts"
  uid      = "resource-alerts-pub"
}

resource "grafana_folder" "policy_alerts_pub" {
  provider = grafana.public_org
  org_id   = grafana_organization.public.org_id
  title    = "Policy Alerts"
  uid      = "policy-alerts-pub"
}

# ============================================================
# Alert Rules — Org 2
# Duplicated from org 1 with pub UIDs and pub datasource refs
# ============================================================

resource "grafana_rule_group" "slo_burn_rate_pub" {
  provider         = grafana.public_org
  org_id           = grafana_organization.public.org_id
  name             = "slo_burn_rate_alerts"
  folder_uid       = grafana_folder.slo_alerts_pub.uid
  interval_seconds = 60

  rule {
    name      = "SLO - Fast Burn (Page)"
    condition = "C"
    for       = "2m"
    no_data_state  = "OK"
    exec_err_state = "OK"
    labels    = { severity = "page", group = "slo" }
    annotations = { summary = "Service error budget burning fast (>14.4x)" }

    data {
      ref_id = "A"
      relative_time_range {
      from = 300
      to   = 0
    }
      datasource_uid = "prometheus-pub"
      model = jsonencode({
        expr    = "service:burnrate5m and on(service) slo:member:errorbudget"
        instant = true
        range   = false
        refId   = "A"
      })
    }
    data {
      ref_id = "B"
      relative_time_range {
      from = 3600
      to   = 0
    }
      datasource_uid = "prometheus-pub"
      model = jsonencode({
        expr    = "service:burnrate1h and on(service) slo:member:errorbudget"
        instant = true
        range   = false
        refId   = "B"
      })
    }
    data {
      ref_id         = "C"
      datasource_uid = "__expr__"
      relative_time_range {
      from = 0
      to   = 0
    }
      model = jsonencode({
        type       = "math"
        expression = "$A > 14.4 && $B > 14.4"
        refId      = "C"
      })
    }
  }

  rule {
    name      = "SLO - Slow Burn (Ticket)"
    condition = "C"
    for       = "5m"
    no_data_state  = "OK"
    exec_err_state = "OK"
    labels    = { severity = "ticket", group = "slo" }
    annotations = { summary = "Service error budget burning slowly (>6x)" }

    data {
      ref_id = "A"
      relative_time_range {
      from = 1800
      to   = 0
    }
      datasource_uid = "prometheus-pub"
      model = jsonencode({
        expr    = "service:burnrate30m and on(service) slo:member:errorbudget"
        instant = true
        range   = false
        refId   = "A"
      })
    }
    data {
      ref_id = "B"
      relative_time_range {
      from = 10800
      to   = 0
    }
      datasource_uid = "prometheus-pub"
      model = jsonencode({
        expr    = "service:burnrate3h and on(service) slo:member:errorbudget"
        instant = true
        range   = false
        refId   = "B"
      })
    }
    data {
      ref_id         = "C"
      datasource_uid = "__expr__"
      relative_time_range {
      from = 0
      to   = 0
    }
      model = jsonencode({
        type       = "math"
        expression = "$A > 6 && $B > 6"
        refId      = "C"
      })
    }
  }

  rule {
    name      = "SLO - p95 Latency Breach"
    condition = "B"
    for       = "5m"
    no_data_state  = "OK"
    exec_err_state = "OK"
    labels    = { severity = "ticket", group = "slo" }
    annotations = { summary = "Service p95 latency above 500ms SLO target" }

    data {
      ref_id = "A"
      relative_time_range {
      from = 300
      to   = 0
    }
      datasource_uid = "prometheus-pub"
      model = jsonencode({
        expr    = "service:latency_p95:5m and on(service) slo:member:latency_p95"
        instant = true
        range   = false
        refId   = "A"
      })
    }
    data {
      ref_id         = "B"
      datasource_uid = "__expr__"
      relative_time_range {
      from = 0
      to   = 0
    }
      model = jsonencode({
        type       = "threshold"
        expression = "A"
        refId      = "B"
        conditions = [{ evaluator = { type = "gt", params = [0.5] } }]
      })
    }
  }
}

resource "grafana_rule_group" "app_resource_pub" {
  provider         = grafana.public_org
  org_id           = grafana_organization.public.org_id
  name             = "app_resource_alerts"
  folder_uid       = grafana_folder.resource_alerts_pub.uid
  interval_seconds = 60

  rule {
    name      = "App - High CPU Usage vs Limit"
    condition = "B"
    for       = "5m"
    no_data_state  = "OK"
    exec_err_state = "OK"
    labels    = { severity = "ticket", scope = "app", group = "resource" }
    annotations = { summary = "Pod CPU usage above 85% of its limit" }

    data {
      ref_id = "A"
      relative_time_range {
      from = 300
      to   = 0
    }
      datasource_uid = "prometheus-pub"
      model = jsonencode({
        expr    = "(sum by (pod) (rate(container_cpu_usage_seconds_total{namespace=\"otel-demo\", container!=\"\"}[5m])) / sum by (pod) (kube_pod_container_resource_limits{namespace=\"otel-demo\", resource=\"cpu\"}) * 100) and on(pod) kube_pod_labels{namespace=\"otel-demo\", label_pod_health=\"true\"}"
        instant = true
        range   = false
        refId   = "A"
      })
    }
    data {
      ref_id         = "B"
      datasource_uid = "__expr__"
      relative_time_range {
      from = 0
      to   = 0
    }
      model = jsonencode({
        type       = "threshold"
        expression = "A"
        refId      = "B"
        conditions = [{ evaluator = { type = "gt", params = [85] } }]
      })
    }
  }

  rule {
    name      = "App - High Memory Usage vs Limit"
    condition = "B"
    for       = "5m"
    no_data_state  = "OK"
    exec_err_state = "OK"
    labels    = { severity = "ticket", scope = "app", group = "resource" }
    annotations = { summary = "Pod memory usage above 85% of its limit (OOM risk)" }

    data {
      ref_id = "A"
      relative_time_range {
      from = 300
      to   = 0
    }
      datasource_uid = "prometheus-pub"
      model = jsonencode({
        expr    = "(sum by (pod) (container_memory_working_set_bytes{namespace=\"otel-demo\", container!=\"\"}) / sum by (pod) (kube_pod_container_resource_limits{namespace=\"otel-demo\", resource=\"memory\"}) * 100) and on(pod) kube_pod_labels{namespace=\"otel-demo\", label_pod_health=\"true\"}"
        instant = true
        range   = false
        refId   = "A"
      })
    }
    data {
      ref_id         = "B"
      datasource_uid = "__expr__"
      relative_time_range {
      from = 0
      to   = 0
    }
      model = jsonencode({
        type       = "threshold"
        expression = "A"
        refId      = "B"
        conditions = [{ evaluator = { type = "gt", params = [85] } }]
      })
    }
  }

  rule {
    name      = "App - Pod Restart Loop"
    condition = "B"
    for       = "5m"
    no_data_state  = "OK"
    exec_err_state = "OK"
    labels    = { severity = "page", scope = "app", group = "resource" }
    annotations = { summary = "Pod restarting repeatedly (CrashLoopBackOff signal)" }

    data {
      ref_id = "A"
      relative_time_range {
      from = 900
      to   = 0
    }
      datasource_uid = "prometheus-pub"
      model = jsonencode({
        expr    = "increase(kube_pod_container_status_restarts_total{namespace=\"otel-demo\"}[15m]) and on(pod) kube_pod_labels{namespace=\"otel-demo\", label_pod_health=\"true\"}"
        instant = true
        range   = false
        refId   = "A"
      })
    }
    data {
      ref_id         = "B"
      datasource_uid = "__expr__"
      relative_time_range {
      from = 0
      to   = 0
    }
      model = jsonencode({
        type       = "threshold"
        expression = "A"
        refId      = "B"
        conditions = [{ evaluator = { type = "gt", params = [2] } }]
      })
    }
  }

  rule {
    name      = "App - Pod Not Running"
    condition = "B"
    for       = "5m"
    no_data_state  = "OK"
    exec_err_state = "OK"
    labels    = { severity = "page", scope = "app", group = "resource" }
    annotations = { summary = "Pod stuck outside Running phase" }

    data {
      ref_id = "A"
      relative_time_range {
      from = 300
      to   = 0
    }
      datasource_uid = "prometheus-pub"
      model = jsonencode({
        expr    = "kube_pod_status_phase{namespace=\"otel-demo\", phase!~\"Running|Succeeded\"} and on(pod) kube_pod_labels{namespace=\"otel-demo\", label_pod_health=\"true\"}"
        instant = true
        range   = false
        refId   = "A"
      })
    }
    data {
      ref_id         = "B"
      datasource_uid = "__expr__"
      relative_time_range {
      from = 0
      to   = 0
    }
      model = jsonencode({
        type       = "threshold"
        expression = "A"
        refId      = "B"
        conditions = [{ evaluator = { type = "gt", params = [0] } }]
      })
    }
  }
}

resource "grafana_rule_group" "infra_resource_pub" {
  provider         = grafana.public_org
  org_id           = grafana_organization.public.org_id
  name             = "infra_resource_alerts"
  folder_uid       = grafana_folder.resource_alerts_pub.uid
  interval_seconds = 60

  rule {
    name      = "Infra - Node High CPU"
    condition = "B"
    for       = "5m"
    no_data_state  = "OK"
    exec_err_state = "OK"
    labels    = { severity = "ticket", scope = "infra", group = "resource" }
    annotations = { summary = "EKS node CPU usage above 80%" }

    data {
      ref_id = "A"
      relative_time_range {
      from = 300
      to   = 0
    }
      datasource_uid = "prometheus-pub"
      model = jsonencode({
        expr    = "100 - (avg by (instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)"
        instant = true
        range   = false
        refId   = "A"
      })
    }
    data {
      ref_id         = "B"
      datasource_uid = "__expr__"
      relative_time_range {
      from = 0
      to   = 0
    }
      model = jsonencode({
        type       = "threshold"
        expression = "A"
        refId      = "B"
        conditions = [{ evaluator = { type = "gt", params = [80] } }]
      })
    }
  }

  rule {
    name      = "Infra - Node High Memory"
    condition = "B"
    for       = "5m"
    no_data_state  = "OK"
    exec_err_state = "OK"
    labels    = { severity = "ticket", scope = "infra", group = "resource" }
    annotations = { summary = "EKS node memory usage above 80%" }

    data {
      ref_id = "A"
      relative_time_range {
      from = 300
      to   = 0
    }
      datasource_uid = "prometheus-pub"
      model = jsonencode({
        expr    = "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100"
        instant = true
        range   = false
        refId   = "A"
      })
    }
    data {
      ref_id         = "B"
      datasource_uid = "__expr__"
      relative_time_range {
      from = 0
      to   = 0
    }
      model = jsonencode({
        type       = "threshold"
        expression = "A"
        refId      = "B"
        conditions = [{ evaluator = { type = "gt", params = [80] } }]
      })
    }
  }

  rule {
    name      = "Infra - Node High Disk Usage"
    condition = "B"
    for       = "5m"
    no_data_state  = "OK"
    exec_err_state = "OK"
    labels    = { severity = "ticket", scope = "infra", group = "resource" }
    annotations = { summary = "EKS node root filesystem usage above 80%" }

    data {
      ref_id = "A"
      relative_time_range {
      from = 300
      to   = 0
    }
      datasource_uid = "prometheus-pub"
      model = jsonencode({
        expr    = "(1 - (node_filesystem_avail_bytes{mountpoint=\"/\", fstype!=\"tmpfs\"} / node_filesystem_size_bytes{mountpoint=\"/\", fstype!=\"tmpfs\"})) * 100"
        instant = true
        range   = false
        refId   = "A"
      })
    }
    data {
      ref_id         = "B"
      datasource_uid = "__expr__"
      relative_time_range {
      from = 0
      to   = 0
    }
      model = jsonencode({
        type       = "threshold"
        expression = "A"
        refId      = "B"
        conditions = [{ evaluator = { type = "gt", params = [80] } }]
      })
    }
  }

  rule {
    name      = "Infra - Node Not Ready"
    condition = "B"
    for       = "5m"
    no_data_state  = "OK"
    exec_err_state = "OK"
    labels    = { severity = "page", scope = "infra", group = "resource" }
    annotations = { summary = "EKS node reporting NotReady condition" }

    data {
      ref_id = "A"
      relative_time_range {
      from = 300
      to   = 0
    }
      datasource_uid = "prometheus-pub"
      model = jsonencode({
        expr    = "sum(kube_node_status_condition{condition=\"Ready\", status=\"true\"} == 0)"
        instant = true
        range   = false
        refId   = "A"
      })
    }
    data {
      ref_id         = "B"
      datasource_uid = "__expr__"
      relative_time_range {
      from = 0
      to   = 0
    }
      model = jsonencode({
        type       = "threshold"
        expression = "A"
        refId      = "B"
        conditions = [{ evaluator = { type = "gt", params = [0] } }]
      })
    }
  }
}

resource "grafana_rule_group" "policy_alerts_pub" {
  provider         = grafana.public_org
  org_id           = grafana_organization.public.org_id
  name             = "app_policy_alerts"
  folder_uid       = grafana_folder.policy_alerts_pub.uid
  interval_seconds = 300

  rule {
    name      = "Policy - Containers Missing CPU Limit"
    condition = "B"
    for       = "1m"
    no_data_state  = "OK"
    exec_err_state = "OK"
    labels    = { severity = "ticket", scope = "policy", group = "policy" }
    annotations = { summary = "Deployment has a container with no CPU limit defined" }

    data {
      ref_id = "A"
      relative_time_range {
      from = 300
      to   = 0
    }
      datasource_uid = "prometheus-pub"
      model = jsonencode({
        expr    = "sum by (deployment) (label_replace(kube_pod_container_status_running{namespace=\"otel-demo\"} unless on(namespace, pod, container) kube_pod_container_resource_limits{namespace=\"otel-demo\", resource=\"cpu\"}, \"deployment\", \"$1\", \"pod\", \"([a-zA-Z0-9-]+?)-[a-z0-9]+-[a-z0-9]+\"))"
        instant = true
        range   = false
        refId   = "A"
      })
    }
    data {
      ref_id         = "B"
      datasource_uid = "__expr__"
      relative_time_range {
      from = 0
      to   = 0
    }
      model = jsonencode({
        type       = "threshold"
        expression = "A"
        refId      = "B"
        conditions = [{ evaluator = { type = "gt", params = [0] } }]
      })
    }
  }

  rule {
    name      = "Policy - Containers Missing CPU Request"
    condition = "B"
    for       = "1m"
    no_data_state  = "OK"
    exec_err_state = "OK"
    labels    = { severity = "ticket", scope = "policy", group = "policy" }
    annotations = { summary = "Deployment has a container with no CPU request defined" }

    data {
      ref_id = "A"
      relative_time_range {
      from = 300
      to   = 0
    }
      datasource_uid = "prometheus-pub"
      model = jsonencode({
        expr    = "sum by (deployment) (label_replace(kube_pod_container_status_running{namespace=\"otel-demo\"} unless on(namespace, pod, container) kube_pod_container_resource_requests{namespace=\"otel-demo\", resource=\"cpu\"}, \"deployment\", \"$1\", \"pod\", \"([a-zA-Z0-9-]+?)-[a-z0-9]+-[a-z0-9]+\"))"
        instant = true
        range   = false
        refId   = "A"
      })
    }
    data {
      ref_id         = "B"
      datasource_uid = "__expr__"
      relative_time_range {
      from = 0
      to   = 0
    }
      model = jsonencode({
        type       = "threshold"
        expression = "A"
        refId      = "B"
        conditions = [{ evaluator = { type = "gt", params = [0] } }]
      })
    }
  }

  rule {
    name      = "Policy - Containers Missing Memory Limit"
    condition = "B"
    for       = "1m"
    no_data_state  = "OK"
    exec_err_state = "OK"
    labels    = { severity = "ticket", scope = "policy", group = "policy" }
    annotations = { summary = "Deployment has a container with no memory limit defined" }

    data {
      ref_id = "A"
      relative_time_range {
      from = 300
      to   = 0
    }
      datasource_uid = "prometheus-pub"
      model = jsonencode({
        expr    = "sum by (deployment) (label_replace(kube_pod_container_status_running{namespace=\"otel-demo\"} unless on(namespace, pod, container) kube_pod_container_resource_limits{namespace=\"otel-demo\", resource=\"memory\"}, \"deployment\", \"$1\", \"pod\", \"([a-zA-Z0-9-]+?)-[a-z0-9]+-[a-z0-9]+\"))"
        instant = true
        range   = false
        refId   = "A"
      })
    }
    data {
      ref_id         = "B"
      datasource_uid = "__expr__"
      relative_time_range {
      from = 0
      to   = 0
    }
      model = jsonencode({
        type       = "threshold"
        expression = "A"
        refId      = "B"
        conditions = [{ evaluator = { type = "gt", params = [0] } }]
      })
    }
  }

  rule {
    name      = "Policy - Containers Missing Memory Request"
    condition = "B"
    for       = "1m"
    no_data_state  = "OK"
    exec_err_state = "OK"
    labels    = { severity = "ticket", scope = "policy", group = "policy" }
    annotations = { summary = "Deployment has a container with no memory request defined" }

    data {
      ref_id = "A"
      relative_time_range {
      from = 300
      to   = 0
    }
      datasource_uid = "prometheus-pub"
      model = jsonencode({
        expr    = "sum by (deployment) (label_replace(kube_pod_container_status_running{namespace=\"otel-demo\"} unless on(namespace, pod, container) kube_pod_container_resource_requests{namespace=\"otel-demo\", resource=\"memory\"}, \"deployment\", \"$1\", \"pod\", \"([a-zA-Z0-9-]+?)-[a-z0-9]+-[a-z0-9]+\"))"
        instant = true
        range   = false
        refId   = "A"
      })
    }
    data {
      ref_id         = "B"
      datasource_uid = "__expr__"
      relative_time_range {
      from = 0
      to   = 0
    }
      model = jsonencode({
        type       = "threshold"
        expression = "A"
        refId      = "B"
        conditions = [{ evaluator = { type = "gt", params = [0] } }]
      })
    }
  }
}

# ============================================================
# Dashboard — Org 2
# Uses null_resource + curl to POST directly to Grafana HTTP API.
# This bypasses grafana_dashboard provider resource which expects
# classic JSON format; Grafana 12 uses a new schema format that
# is passed as-is to the /api/dashboards/db endpoint.
# Org context is set via X-Grafana-Org-Id header.
# ============================================================

resource "null_resource" "demo_dashboard_pub" {
  triggers = {
    dashboard_hash = filemd5("${path.module}/dashboard.json")
    org_id         = grafana_organization.public.org_id
  }

  provisioner "local-exec" {
    command     = "python3 '${path.module}/import_dashboard.py' '${var.grafana_url}' '${grafana_organization.public.org_id}' 'admin' '${var.ui_admin_password}' '${path.module}/dashboard.json'"
  }

  provisioner "local-exec" {
    command     = "python3 '${path.module}/import_dashboard.py' '${var.grafana_url}' 'default' 'admin' '${var.ui_admin_password}' '${path.module}/dashboard.json'"
  }

  depends_on = [
    grafana_data_source.prometheus_pub,
    grafana_data_source.loki_pub,
    grafana_data_source.tempo_pub,
    grafana_folder.slo_alerts_pub,
    grafana_folder.resource_alerts_pub,
    grafana_folder.policy_alerts_pub,
  ]
}
