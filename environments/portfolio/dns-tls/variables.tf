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

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "domain.com"
}

variable "cloudflare_api_token" {
  description = "Cloudflare api token should be gitignored in terraform.tfvars"
  type        = string
  default     = ""
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone id token may also be gitignored in terraform.tfvars"
  type        = string
  default     = ""
}