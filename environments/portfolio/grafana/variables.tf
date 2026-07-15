variable "grafana_url" {
  description = "Grafana instance URL"
  type        = string
  default     = "https://grafana.creechlabs.dev"
}

variable "ui_admin_password" {
  description = "Grafana admin password — pulled AWS Secrets Manager"
  type        = string
  sensitive   = true
}

variable "prometheus_url" {
  description = "Prometheus internal cluster URL"
  type        = string
  default     = "http://prometheus-server.observability.svc.cluster.local"
}

variable "loki_url" {
  description = "Loki internal cluster URL"
  type        = string
  default     = "http://loki.observability.svc.cluster.local:3100"
}

variable "tempo_url" {
  description = "Tempo internal cluster URL"
  type        = string
  default     = "http://tempo.observability.svc.cluster.local:3200"
}

variable "cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "cl-portfolio-cluster"
}