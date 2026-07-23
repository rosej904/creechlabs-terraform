terraform {
  required_version = ">= 1.6.0"

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
# S3 bucket — Mimir TSDB blocks (long-term metrics storage)
#
# INTENTIONALLY NOT part of the nightly destroy / morning apply
# cycle. This bucket, and only this bucket, persists across every
# EKS cluster rebuild. Do not add this layer to the CodeBuild
# buildspecs.
# ------------------------------------------------------------
resource "aws_s3_bucket" "mimir_blocks" {
  bucket = "${var.project_name}-mimir-blocks-${data.aws_caller_identity.current.account_id}"

  # Guard rail: force_destroy stays false so an accidental
  # `terraform destroy` against this layer can't silently wipe
  # 30 days of metrics history in one command.
  force_destroy = false

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-mimir-blocks"
  })
}

resource "aws_s3_bucket_versioning" "mimir_blocks" {
  bucket = aws_s3_bucket.mimir_blocks.id

  versioning_configuration {
    status = var.enable_bucket_versioning ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "mimir_blocks" {
  bucket = aws_s3_bucket.mimir_blocks.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "mimir_blocks" {
  bucket = aws_s3_bucket.mimir_blocks.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Mimir's compactor/ingesters issue frequent block uploads. If a pod
# gets killed mid-upload (e.g. cluster torn down at 5pm mid-write),
# stray incomplete multipart uploads can accumulate and quietly rack
# up storage cost. Clean those up automatically.
resource "aws_s3_bucket_lifecycle_configuration" "mimir_blocks" {
  bucket = aws_s3_bucket.mimir_blocks.id

  rule {
    id     = "abort-incomplete-multipart-uploads"
    status = "Enabled"

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }

    filter {}
  }

  # Only relevant if versioning is ever turned on — keeps noncurrent
  # versions from piling up storage cost indefinitely.
  dynamic "rule" {
    for_each = var.enable_bucket_versioning ? [1] : []

    content {
      id     = "expire-noncurrent-versions"
      status = "Enabled"

      noncurrent_version_expiration {
        noncurrent_days = 7
      }

      filter {}
    }
  }
}

resource "aws_s3_bucket_policy" "mimir_blocks" {
  bucket = aws_s3_bucket.mimir_blocks.id
  policy = data.aws_iam_policy_document.mimir_blocks_bucket_policy.json
}

data "aws_iam_policy_document" "mimir_blocks_bucket_policy" {
  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = ["s3:*"]

    resources = [
      aws_s3_bucket.mimir_blocks.arn,
      "${aws_s3_bucket.mimir_blocks.arn}/*",
    ]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

# ------------------------------------------------------------
# IAM policy document for Mimir's IRSA role.
#
# The ROLE itself is intentionally NOT created here — it needs
# to trust the EKS cluster's OIDC provider, which is destroyed
# and recreated every day. A role created here would be left
# pointing at a stale/nonexistent OIDC provider after the first
# destroy cycle.
#
# This layer only owns the permissions document + bucket outputs.
# eks-infra (which already re-runs every morning) creates the role
# with a fresh trust policy and attaches this policy ARN via
# terraform_remote_state. See eks-infra-irsa-snippet.tf.
# ------------------------------------------------------------
data "aws_iam_policy_document" "mimir_s3_access" {
  statement {
    sid    = "MimirBucketList"
    effect = "Allow"

    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation",
    ]

    resources = [aws_s3_bucket.mimir_blocks.arn]
  }

  statement {
    sid    = "MimirObjectAccess"
    effect = "Allow"

    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
    ]

    resources = ["${aws_s3_bucket.mimir_blocks.arn}/*"]
  }
}

resource "aws_iam_policy" "mimir_s3_access" {
  name        = "${var.project_name}-mimir-s3-access"
  description = "Read/write access to the Mimir TSDB blocks bucket"
  policy      = data.aws_iam_policy_document.mimir_s3_access.json

  tags = local.common_tags
}
