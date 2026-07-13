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
  default     = "chore/eks-update-136"
}

variable "schedules_enabled" {
  description = "Enable or disable EventBridge schedules — set false to pause without destroying"
  type        = bool
  default     = true
}


variable "cloudflare_api_token" {
  description = "Cloudflare api token should be gitignored in terraform.tfvars"
  type        = string
  default     = ""
}

variable "ui_admin_password" {
  description = "Argo CD admin password"
  type        = string
  default     = "password"
}

variable "argocd_repo_ssh_private_key" {
  description = "Private ssh key for argocd repo"
  type        = string
  default     = "privatekey"
}