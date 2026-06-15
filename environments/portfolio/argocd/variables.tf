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

variable "argocd_chart_version" {
  description = "Argo CD helm chart version"
  type        = string
  default     = "9.5.21"
}

variable "argocd_admin_password" {
  description = "Argo CD admin password"
  type        = string
  default     = "password"
}

variable "github_repo_ssh_url" {
  description = "Github repo url"
  type        = string
  default     = "https://github.com/user/repo"
}

variable "github_branch" {
  description = "Github branch name"
  type        = string
  default     = "main"
}

variable "argocd_repo_ssh_private_key" {
  description = "Private ssh key for argocd repo"
  type        = string
  default     = "privatekey"
}