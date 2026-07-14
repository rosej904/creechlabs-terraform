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

variable "kubernetes_version" {
  description = "EKS Kubernetes version"
  type        = string
  default     = "1.36"
}

variable "stable_node_instance_type" {
  description = "EC2 instance type for the on-demand stable node pool (runs stateful/critical workloads e.g. Grafana)"
  type        = string
  default     = "t3.medium"
}

variable "stable_node_desired_count" {
  description = "Desired number of nodes in the on-demand stable pool"
  type        = number
  default     = 1
}

variable "stable_node_min_count" {
  description = "Minimum number of nodes in the on-demand stable pool"
  type        = number
  default     = 1
}

variable "stable_node_max_count" {
  description = "Maximum number of nodes in the on-demand stable pool"
  type        = number
  default     = 1
}

variable "spot_node_instance_types" {
  description = "EC2 instance types for the Spot node pool (multiple similar types improve Spot allocation/availability)"
  type        = list(string)
  default     = ["t3.medium", "t3a.medium", "t3.small"]
}

variable "spot_node_desired_count" {
  description = "Desired number of nodes in the Spot pool"
  type        = number
  default     = 1
}

variable "spot_node_min_count" {
  description = "Minimum number of nodes in the Spot pool"
  type        = number
  default     = 1
}

variable "spot_node_max_count" {
  description = "Maximum number of nodes in the Spot pool"
  type        = number
  default     = 3
}

variable "eks_admin_users" {
  description = "List of IAM usernames to grant kubectl cluster-admin access"
  type        = list(string)
  default     = []
}