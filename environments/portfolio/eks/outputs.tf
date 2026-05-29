output "cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.main.name
}

output "cluster_endpoint" {
  description = "EKS cluster API endpoint"
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_ca_certificate" {
  description = "EKS cluster CA certificate (base64)"
  value       = aws_eks_cluster.main.certificate_authority[0].data
  sensitive   = true
}

output "oidc_provider_arn" {
  description = "OIDC provider ARN — used for creating IRSA roles in later layers"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "oidc_provider_url" {
  description = "OIDC provider URL — used for creating IRSA roles in later layers"
  value       = aws_iam_openid_connect_provider.eks.url
}

output "node_role_arn" {
  description = "Node group IAM role ARN"
  value       = aws_iam_role.eks_nodes.arn
}

output "eks_console_admin_role_arn" {
  description = "Attach this role to any IAM user or group that needs EKS admin console access"
  value       = aws_iam_role.eks_console_admin.arn
}

output "kubeconfig_command" {
  description = "Run this command to configure kubectl after apply"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}"
}
