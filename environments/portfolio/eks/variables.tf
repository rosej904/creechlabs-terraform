variable "aws_account_id" {
  description = "AWS Account Id"
  type        = string
}

variable "aws_iam_user" {
  description = "AWS IAM User used to login to the console"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name used as prefix for all resources"
  type        = string
  default     = "portfolio"
}

variable "kubernetes_version" {
  description = "EKS Kubernetes version"
  type        = string
  default     = "1.30"
}

variable "node_instance_type" {
  description = "EC2 instance type for EKS nodes"
  type        = string
  default     = "t3.medium"
}

variable "node_desired_count" {
  description = "Desired number of nodes"
  type        = number
  default     = 3
}

variable "node_min_count" {
  description = "Minimum number of nodes"
  type        = number
  default     = 2
}

variable "node_max_count" {
  description = "Maximum number of nodes"
  type        = number
  default     = 4
}

variable "use_spot_instances" {
  description = "Use spot instances for cost savings (not recommended for production)"
  type        = bool
  default     = false
}
