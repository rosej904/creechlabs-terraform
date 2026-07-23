output "mimir_blocks_bucket_name" {
  description = "Name of the S3 bucket storing Mimir TSDB blocks"
  value       = aws_s3_bucket.mimir_blocks.bucket
}

output "mimir_blocks_bucket_arn" {
  description = "ARN of the S3 bucket storing Mimir TSDB blocks"
  value       = aws_s3_bucket.mimir_blocks.arn
}

output "mimir_s3_access_policy_arn" {
  description = "ARN of the IAM policy granting read/write access to the Mimir blocks bucket. Attach this to an IRSA role created in the eks-infra layer — do not recreate the policy there."
  value       = aws_iam_policy.mimir_s3_access.arn
}
