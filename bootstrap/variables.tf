variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used as a prefix for all resources"
  type        = string
  default     = "portfolio"
}

variable "aws_account_id" {
  description = "Your AWS account ID (used to make S3 bucket name globally unique)"
  type        = string
}
