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
  description = "Primary domain name — hosted zone will be created for this"
  type        = string
  default     = "portfolio.creechlabs.dev"
}