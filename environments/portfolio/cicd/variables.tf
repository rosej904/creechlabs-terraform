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

variable "state_bucket_name" {
  description = "S3 bucket name for Terraform remote state — must already exist"
  type        = string
}

variable "github_repo_url" {
  description = "HTTPS URL of the GitHub repo containing Terraform code"
  type        = string
}

variable "github_branch" {
  description = "Git branch CodeBuild will clone and run against"
  type        = string
  default     = "main"
}