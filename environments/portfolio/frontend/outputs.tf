output "s3_bucket_name" {
  description = "S3 bucket holding the built React app — target for `aws s3 sync`"
  value       = aws_s3_bucket.frontend.id
}

output "cloudfront_distribution_id" {
  description = "Main CloudFront distribution ID — needed for cache invalidations on deploy"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain_name" {
  description = "CloudFront-assigned domain (*.cloudfront.net) — target for Cloudflare CNAMEs"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "com_redirect_cloudfront_domain_name" {
  description = "CloudFront-assigned domain for the .com redirect distribution"
  value       = aws_cloudfront_distribution.com_redirect.domain_name
}

output "www_redirect_cloudfront_domain_name" {
  description = "CloudFront-assigned domain for the www.creechlabs.dev redirect distribution"
  value       = aws_cloudfront_distribution.www_redirect.domain_name
}

output "status_api_endpoint" {
  description = "API Gateway invoke URL for the status checker (CloudFront proxies this at /api/status)"
  value       = aws_apigatewayv2_api.status_api.api_endpoint
}

output "status_lambda_function_name" {
  description = "Lambda function name, for manual invokes / log lookups"
  value       = aws_lambda_function.status_checker.function_name
}

output "site_urls" {
  description = "All public URLs reachable for this site. portfolio = canonical; everything else redirects to it."
  value = {
    portfolio = "https://${var.domain_name}"
    www       = "https://${var.www_domain_name} (redirects to ${var.domain_name})"
    redirect  = "https://${var.redirect_domain_name} (redirects to ${var.domain_name})"
  }
}
