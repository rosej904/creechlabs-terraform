output "public_org_id" {
  description = "Grafana Public org ID — matches what grafana.ini auth.anonymous.org_name resolves to"
  value       = grafana_organization.public.org_id
}

output "grafana_url" {
  description = "Grafana base URL — anonymous viewers access dashboards here without login"
  value       = var.grafana_url
}
