# ---------------------------------------------------------------------------
# Cloudflare DNS for SES — DKIM + custom MAIL FROM
#
# Lives in the frontend layer, not dns-tls, on purpose. The SES identity is
# declared here, and frontend already consumes the ACM cert from dns-tls.
# Having dns-tls read these tokens back out via terraform_remote_state would
# make the two layers mutually dependent and neither applyable from scratch.
#
# Records are derived from the resource rather than hardcoded, so token
# rotation (or a next_signing_key_length change) reconciles on the next apply
# instead of silently breaking signing.
#
# Pattern, TTL, and flags follow cloudflare_record.acm_validation in dns-tls.
# ---------------------------------------------------------------------------

# --- DKIM: three CNAMEs, aligns DKIM with the From: domain ------------------
resource "cloudflare_record" "ses_dkim" {
  for_each = {
    for token in aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens :
    token => token
  }

  zone_id         = var.cloudflare_zone_id
  name            = "${each.value}._domainkey.${var.domain_name}"
  content         = "${each.value}.dkim.amazonses.com"
  type            = "CNAME"
  ttl             = 60
  proxied         = false
  allow_overwrite = true

  comment = "SES DKIM signing — managed by Terraform"
}

# --- Custom MAIL FROM: aligns SPF with the From: domain ---------------------
# Subdomain only. Does NOT touch the apex MX, so Cloudflare Email Routing on
# creechlabs.dev is unaffected.
resource "cloudflare_record" "ses_mail_from_mx" {
  zone_id         = var.cloudflare_zone_id
  name            = aws_sesv2_email_identity_mail_from_attributes.domain.mail_from_domain
  content         = "feedback-smtp.${var.aws_region}.amazonses.com"
  type            = "MX"
  priority        = 10
  ttl             = 60
  proxied         = false
  allow_overwrite = true

  comment = "SES custom MAIL FROM — managed by Terraform"
}

resource "cloudflare_record" "ses_mail_from_spf" {
  zone_id         = var.cloudflare_zone_id
  name            = aws_sesv2_email_identity_mail_from_attributes.domain.mail_from_domain
  content         = "v=spf1 include:amazonses.com ~all"
  type            = "TXT"
  ttl             = 60
  proxied         = false
  allow_overwrite = true

  comment = "SES custom MAIL FROM SPF — managed by Terraform"
}

# ---------------------------------------------------------------------------
# Required additions to this layer (frontend), mirroring dns-tls:
#
#   terraform {
#     required_providers {
#       cloudflare = {
#         source  = "cloudflare/cloudflare"
#         version = "~> 4.0"
#       }
#     }
#   }
#
#   provider "cloudflare" {
#     api_token = var.cloudflare_api_token
#   }
#
#   variable "cloudflare_api_token" {
#     type      = string
#     sensitive = true
#   }
#
#   variable "cloudflare_zone_id" {
#     type = string
#   }
#
# Adding a provider requires `terraform init -backend-config=backend.hcl`
# again before plan.
# ---------------------------------------------------------------------------
