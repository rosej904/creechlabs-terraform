# ─────────────────────────────────────────────────────────
# S3 Buckets + CF Dist for redirects
# ─────────────────────────────────────────────────────────

resource "aws_s3_bucket" "www_redirect" {
  bucket = "cl-portfolio-www-redirect-${var.aws_account_id}"
}

resource "aws_s3_bucket_public_access_block" "www_redirect" {
  bucket = aws_s3_bucket.www_redirect.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_website_configuration" "www_redirect" {
  bucket = aws_s3_bucket.www_redirect.id

  redirect_all_requests_to {
    host_name = var.domain_name # creechlabs.dev
    protocol  = "https"
  }
}

resource "aws_cloudfront_distribution" "www_redirect" {
  enabled         = true
  is_ipv6_enabled = true
  comment          = "www.creechlabs.dev redirect to apex"
  price_class      = "PriceClass_100"

  aliases = [var.www_domain_name]

  origin {
    domain_name = aws_s3_bucket_website_configuration.www_redirect.website_endpoint
    origin_id   = "s3-website-www-redirect"

    custom_origin_config {
      http_port                = 80
      https_port                = 443
      origin_protocol_policy    = "http-only" # S3 website endpoints don't support HTTPS
      origin_ssl_protocols      = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods         = ["GET", "HEAD"]
    cached_methods           = ["GET", "HEAD"]
    target_origin_id         = "s3-website-www-redirect"
    viewer_protocol_policy   = "redirect-to-https"
    compress                 = true

    cache_policy_id = data.aws_cloudfront_cache_policy.caching_disabled.id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method        = "sni-only"
    minimum_protocol_version  = "TLSv1.2_2021"
  }
}
