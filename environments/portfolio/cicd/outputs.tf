output "codebuild_apply_project_name" {
  description = "CodeBuild project name for terraform apply"
  value       = aws_codebuild_project.terraform_apply.name
}

output "codebuild_destroy_project_name" {
  description = "CodeBuild project name for terraform destroy"
  value       = aws_codebuild_project.terraform_destroy.name
}

output "codebuild_role_arn" {
  description = "IAM role ARN assumed by CodeBuild at runtime"
  value       = aws_iam_role.codebuild_terraform.arn
}

output "github_connection_arn" {
  description = "CodeStar connection ARN — must be manually activated in console before builds can run"
  value       = aws_codestarconnections_connection.github.arn
}

output "log_group_name" {
  description = "CloudWatch log group for all CodeBuild runs"
  value       = aws_cloudwatch_log_group.codebuild.name
}
