output "aws_lbc_role_arn" {
  description = "IRSA role ARN for AWS Load Balancer Controller"
  value       = aws_iam_role.aws_lbc.arn
}

output "mimir_irsa_role_arn" {
  description = "IRSA role ARN for the Mimir service account — plug into Helm values serviceAccount.annotations"
  value       = aws_iam_role.mimir_irsa.arn
}