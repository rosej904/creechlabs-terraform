# ─────────────────────────────────────────────────────────
# Cloudflare DNS records.
# ─────────────────────────────────────────────────────────

# Apex -> main CloudFront distribution (real content)
resource "cloudflare_record" "apex_dev" {
  zone_id = var.cloudflare_zone_id
  name    = "creechlabs.dev"
  type    = "CNAME"
  content = aws_cloudfront_distribution.frontend.domain_name
  proxied = false
  ttl     = 300
}

# www redirect distribution -> apex
resource "cloudflare_record" "www_dev" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  type    = "CNAME"
  content = aws_cloudfront_distribution.www_redirect.domain_name
  proxied = false
  ttl     = 300
}

# com apex -> redirect distribution -> apex (.dev)
# NOTE: this assumes creechlabs.com is its own Cloudflare zone
resource "cloudflare_record" "apex_com" {
  zone_id = var.cloudflare_com_zone_id
  name    = "creechlabs.com"
  type    = "CNAME"
  content = aws_cloudfront_distribution.com_redirect.domain_name
  proxied = false
  ttl     = 300
}

resource "cloudflare_record" "www_com" {
  zone_id = var.cloudflare_com_zone_id
  name    = "www"
  type    = "CNAME"
  content = aws_cloudfront_distribution.com_redirect.domain_name
  proxied = false
  ttl     = 300
}
