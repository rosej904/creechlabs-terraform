variable "aws_region" {
  description = "AWS region for Mimir storage resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix, used for resource naming and tagging"
  type        = string
  default     = "cl-portfolio"
}

variable "enable_bucket_versioning" {
  description = "Whether to enable S3 versioning on the Mimir blocks bucket. Left off by default — Mimir's own compactor handles retention/cleanup, and versioning would otherwise let noncurrent object versions accumulate cost."
  type        = bool
  default     = false
}