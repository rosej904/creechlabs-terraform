terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

# ------------------------------------------------------------
# CloudWatch Log Group — shared by both CodeBuild projects
# ------------------------------------------------------------
resource "aws_cloudwatch_log_group" "codebuild" {
  name              = "/codebuild/${var.project_name}-terraform"
  retention_in_days = 30

  tags = local.common_tags
}

# ------------------------------------------------------------
# CodeBuild Project — Terraform Apply
# ------------------------------------------------------------
resource "aws_codebuild_project" "terraform_apply" {
  name          = "${var.project_name}-terraform-apply"
  description   = "Runs terraform apply across all portfolio core layers"
  service_role  = aws_iam_role.codebuild_terraform.arn
  build_timeout = 60  # minutes — EKS takes ~15min

  source {
    type            = "GITHUB"
    location        = var.github_repo_url
    git_clone_depth = 1

    buildspec = "environments/portfolio/cicd/buildspecs/apply.yml"
  }

  source_version = var.github_branch

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/standard:7.0"  # includes terraform
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "TF_STATE_BUCKET"
      value = var.state_bucket_name
    }

    environment_variable {
      name  = "AWS_REGION"
      value = var.aws_region
    }

    environment_variable {
      name  = "PROJECT_NAME"
      value = var.project_name
    }

    environment_variable {
      name  = "CLOUDFLARE_API_TOKEN"
      value = var.cloudflare_api_token
      type  = "SECRETS_MANAGER"
}
  }

  artifacts {
    type = "NO_ARTIFACTS"
  }

  logs_config {
    cloudwatch_logs {
      group_name  = aws_cloudwatch_log_group.codebuild.name
      stream_name = "apply"
      status      = "ENABLED"
    }
  }

  tags = local.common_tags
}

# ------------------------------------------------------------
# CodeBuild Project — Terraform Destroy
# ------------------------------------------------------------
resource "aws_codebuild_project" "terraform_destroy" {
  name          = "${var.project_name}-terraform-destroy"
  description   = "Runs terraform destroy across all portfolio core layers"
  service_role  = aws_iam_role.codebuild_terraform.arn
  build_timeout = 60

  source {
    type            = "GITHUB"
    location        = var.github_repo_url
    git_clone_depth = 1

    buildspec = "environments/portfolio/cicd/buildspecs/destroy.yml"
  }

  source_version = var.github_branch

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/standard:7.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "TF_STATE_BUCKET"
      value = var.state_bucket_name
    }

    environment_variable {
      name  = "AWS_REGION"
      value = var.aws_region
    }

    environment_variable {
      name  = "PROJECT_NAME"
      value = var.project_name
    }
  }

  artifacts {
    type = "NO_ARTIFACTS"
  }

  logs_config {
    cloudwatch_logs {
      group_name  = aws_cloudwatch_log_group.codebuild.name
      stream_name = "destroy"
      status      = "ENABLED"
    }
  }

  tags = local.common_tags
}

# ------------------------------------------------------------
# CodeStar Connection — GitHub auth for CodeBuild
# After apply: must manually activate in AWS console once
# Console → CodeBuild → Settings → Connections → Activate
# ------------------------------------------------------------
resource "aws_codestarconnections_connection" "github" {
  name          = "${var.project_name}-github"
  provider_type = "GitHub"

  tags = local.common_tags
}
