variable "aws_region" {
  description = "AWS region for the portfolio-ui resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used as prefix for all resources"
  type        = string
  default     = "cl-portfolio"
}

variable "aws_account_id" {
  description = "AWS account ID (creechlabs)"
  type        = string
  default     = "445606683808"
}

variable "domain_name" {
  description = "Canonical domain for the portfolio UI — the apex. All other domains (www, .com) redirect here."
  type        = string
  default     = "creechlabs.dev"
}

variable "www_domain_name" {
  description = "www redirects to the apex, never serves content directly"
  type        = string
  default     = "www.creechlabs.dev"
}

variable "redirect_domain_name" {
  description = "creechlabs.com — redirects to the .dev domain"
  type        = string
  default     = "creechlabs.com"
}

variable "redirect_target_url" {
  description = "Full URL that creechlabs.com redirects to"
  type        = string
  default     = "https://creechlabs.dev"
}

variable "acm_certificate_arn" {
  description = "Wildcard ACM cert ARN for *.creechlabs.dev (us-east-1, required for CloudFront) — used by the main portfolio distribution only"
  type        = string
  default     = "arn:aws:acm:us-east-1:445606683808:certificate/bced14e9-9cc5-49f1-b1fa-f762b4de535a"
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for creechlabs.dev"
  type        = string
  default     = "2a6a6ed69bd55f9924210b98b0f0ea10"
}

variable "cloudflare_com_zone_id" {
  description = "Cloudflare zone ID for creechlabs.com (separate zone — set via tfvars)"
  type        = string
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token, sourced from Secrets Manager via TF_VAR_cloudflare_api_token in CI, or local tfvars for manual apply"
  type        = string
  sensitive   = true
}

variable "status_check_targets" {
  description = "Map of service name -> health check URL, checked by the status Lambda"
  type        = map(string)
  default = {
    argocd     = "https://argocd.creechlabs.dev/healthz"
    grafana    = "https://grafana.creechlabs.dev/api/health"
    otel_demo  = "https://otel-demo.creechlabs.dev/"
  }
}

variable "eks_cluster_name" {
  description = "Name of the EKS cluster the status Lambda checks"
  type        = string
  default     = "cl-portfolio-cluster"
}

variable "lambda_log_retention_days" {
  description = "CloudWatch log retention for the status Lambda"
  type        = number
  default     = 14
}
