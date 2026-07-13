variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used as prefix for all resources"
  type        = string
  default     = "cl-portfolio"
}

variable "aws_lbc_version" {
  description = "Helm chart version for AWS Load Balancer Controller"
  type        = string
  default     = "3.4.1"
}

variable "cloudflare_api_token" {
  type        = string
  description = "Cloudflare API token passed from CI/CD environment"
  sensitive   = true
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "creechlabs.dev"
}

variable "external_dns_version" {
  description = "Helm Chart latest stable version"
  type        = string
  default     = "1.21.1"
}