# ------------------------------------------------------------
# IAM Role — CodeBuild assumes this at runtime
# No static credentials needed — temporary token via instance role
# ------------------------------------------------------------
resource "aws_iam_role" "codebuild_terraform" {
  name = "${var.project_name}-codebuild-terraform"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "codebuild.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

# ------------------------------------------------------------
# Policy — CodeBuild logs (required for all CodeBuild projects)
# ------------------------------------------------------------
resource "aws_iam_policy" "codebuild_logs" {
  name        = "${var.project_name}-codebuild-logs"
  description = "Allows CodeBuild to write logs to CloudWatch"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "CloudWatchLogs"
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Resource = "*"
    }]
  })

  tags = local.common_tags
}

# ------------------------------------------------------------
# Policy — S3 access for TF state bucket
# ------------------------------------------------------------
resource "aws_iam_policy" "codebuild_state" {
  name        = "${var.project_name}-codebuild-tf-state"
  description = "Allows CodeBuild to read/write Terraform remote state"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "StateS3Access"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.state_bucket_name}",
          "arn:aws:s3:::${var.state_bucket_name}/*"
        ]
      }
    ]
  })

  tags = local.common_tags
}

# ------------------------------------------------------------
# Policy — AdministratorAccess for Terraform to provision infra
# Scope this down later once all layers are stable
# ------------------------------------------------------------
resource "aws_iam_policy" "codebuild_infra" {
  name        = "${var.project_name}-codebuild-infra"
  description = "Allows CodeBuild/Terraform to provision portfolio infrastructure"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid      = "TerraformInfraAccess"
      Effect   = "Allow"
      Action   = "*"
      Resource = "*"
    }]
  })

  tags = local.common_tags
}

# ------------------------------------------------------------
# Attach all policies to the CodeBuild role
# ------------------------------------------------------------
resource "aws_iam_role_policy_attachment" "codebuild_logs" {
  role       = aws_iam_role.codebuild_terraform.name
  policy_arn = aws_iam_policy.codebuild_logs.arn
}

resource "aws_iam_role_policy_attachment" "codebuild_state" {
  role       = aws_iam_role.codebuild_terraform.name
  policy_arn = aws_iam_policy.codebuild_state.arn
}

resource "aws_iam_role_policy_attachment" "codebuild_infra" {
  role       = aws_iam_role.codebuild_terraform.name
  policy_arn = aws_iam_policy.codebuild_infra.arn
}
