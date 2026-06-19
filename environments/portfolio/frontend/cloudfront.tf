# ─────────────────────────────────────────────────────────
# CloudFront distribution
# ─────────────────────────────────────────────────────────

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "cl-portfolio-ui-oac"
  description                       = "OAC for creechlabs portfolio UI bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  comment              = "creechlabs portfolio UI"
  price_class          = "PriceClass_100" # cheapest tier — NA/EU edge locations only

  aliases = [
    var.domain_name,
  ]

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "s3-portfolio-ui"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  # Separate origin for the status API so the React app can call
  # a same-site relative path (/api/status) and avoid CORS entirely.
  origin {
    domain_name = replace(aws_apigatewayv2_api.status_api.api_endpoint, "https://", "")
    origin_id   = "apigw-status"

    custom_origin_config {
      http_port              = 80
      https_port              = 443
      origin_protocol_policy  = "https-only"
      origin_ssl_protocols    = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods          = ["GET", "HEAD"]
    target_origin_id        = "s3-portfolio-ui"
    viewer_protocol_policy  = "redirect-to-https"
    compress                = true

    cache_policy_id = data.aws_cloudfront_cache_policy.caching_optimized.id
  }

  # /api/* routed to API Gateway, never cached.
  ordered_cache_behavior {
    path_pattern             = "/api/*"
    allowed_methods          = ["GET", "HEAD", "OPTIONS"]
    cached_methods            = ["GET", "HEAD"]
    target_origin_id          = "apigw-status"
    viewer_protocol_policy    = "redirect-to-https"
    compress                  = true

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host_header.id
  }

  # SPA fallback — unknown paths (incl. nonexistent subpaths) render index.html.
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
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

data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer_except_host_header" {
  name = "Managed-AllViewerExceptHostHeader"
}
