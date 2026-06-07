# ------------------------------------------------------------
# EventBridge IAM Role — allows EventBridge to trigger CodeBuild
# ------------------------------------------------------------
resource "aws_iam_role" "eventbridge_codebuild" {
  name = "${var.project_name}-eventbridge-codebuild"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "scheduler.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "eventbridge_codebuild" {
  name = "start-codebuild-builds"
  role = aws_iam_role.eventbridge_codebuild.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "codebuild:StartBuild"
      Resource = [
        aws_codebuild_project.terraform_apply.arn,
        aws_codebuild_project.terraform_destroy.arn
      ]
    }]
  })
}

# ------------------------------------------------------------
# EventBridge Schedule — Apply (Mon-Fri 8:30am EST)
# ------------------------------------------------------------
resource "aws_scheduler_schedule" "terraform_apply" {
  name       = "${var.project_name}-terraform-apply"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression          = "cron(30 08 ? * MON-FRI *)" 
  schedule_expression_timezone = "America/New_York"   # handles EST/EDT automatically

  target {
    arn      = aws_codebuild_project.terraform_apply.arn
    role_arn = aws_iam_role.eventbridge_codebuild.arn

    input = jsonencode({
      projectName = aws_codebuild_project.terraform_apply.name
    })
  }

  state = var.schedules_enabled ? "ENABLED" : "DISABLED"
}

# ------------------------------------------------------------
# EventBridge Schedule — Destroy (Mon-Fri 5:00pm EST)
# ------------------------------------------------------------
resource "aws_scheduler_schedule" "terraform_destroy" {
  name       = "${var.project_name}-terraform-destroy"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression          = "cron(0 17 ? * MON-FRI *)"
  schedule_expression_timezone = "America/New_York"

  target {
    arn      = aws_codebuild_project.terraform_destroy.arn
    role_arn = aws_iam_role.eventbridge_codebuild.arn

    input = jsonencode({
      projectName = aws_codebuild_project.terraform_destroy.name
    })
  }

  state = var.schedules_enabled ? "ENABLED" : "DISABLED"
}