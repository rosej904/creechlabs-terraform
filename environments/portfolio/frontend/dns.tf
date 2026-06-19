# ─────────────────────────────────────────────────────────
# Cloudflare DNS records.
#
# creechlabs.dev (apex) is the ONLY domain that serves real
# content. Everything else is a redirect:
#   www.creechlabs.dev   -> redirect distribution -> apex
#   creechlabs.com        -> redirect distribution -> apex
#   www.creechlabs.com    -> redirect distribution -> apex
#
# No portfolio.creechlabs.dev subdomain — intentionally not
# created or used anywhere.
#
# Proxied = false (DNS-only / grey cloud) since CloudFront
# already terminates TLS and proxying through Cloudflare on
# top would add a redundant hop and complicate cert validation.
# ─────────────────────────────────────────────────────────

# Apex creechlabs.dev -> main CloudFront distribution (real content)
resource "cloudflare_record" "apex_dev" {
  zone_id = var.cloudflare_zone_id
  name    = "creechlabs.dev"
  type    = "CNAME"
  content = aws_cloudfront_distribution.frontend.domain_name
  proxied = false
  ttl     = 300
}

# www.creechlabs.dev -> www redirect distribution -> apex
resource "cloudflare_record" "www_dev" {
  zone_id = var.cloudflare_zone_id
  name    = "www"
  type    = "CNAME"
  content = aws_cloudfront_distribution.www_redirect.domain_name
  proxied = false
  ttl     = 300
}

# creechlabs.com apex -> redirect distribution -> apex (.dev)
# NOTE: this assumes creechlabs.com is its own Cloudflare zone
# (separate from creechlabs.dev). Set cloudflare_com_zone_id in tfvars.
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
