output "state_bucket_name" {
  description = "S3 bucket name for TF remote state — use this in all other layer backend configs"
  value       = aws_s3_bucket.tf_state.bucket
}

output "state_bucket_arn" {
  description = "ARN of the state bucket"
  value       = aws_s3_bucket.tf_state.arn
}
