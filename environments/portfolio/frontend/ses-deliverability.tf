# ---------------------------------------------------------------------------
# SES deliverability + delivery observability
#
# Why this is needed: an EMAIL_ADDRESS identity does no DKIM signing, and SES
# uses its own envelope sender, so neither SPF nor DKIM *aligns* with the
# From: domain. DMARC requires one of them to align. Sending
# jordan_rose@creechlabs.dev -> itself, unsigned, via a third party is
# indistinguishable from spoofing, so receivers drop or quarantine it while
# SES still reports a clean handoff.
#
# A domain identity fixes DKIM alignment. Custom MAIL FROM fixes SPF
# alignment. Either one satisfies DMARC; doing both is belt and braces.
# ---------------------------------------------------------------------------

resource "aws_sesv2_email_identity" "domain" {
  email_identity = var.domain_name

  dkim_signing_attributes {
    next_signing_key_length = "RSA_2048_BIT"
  }
}

# Three CNAMEs to add in Cloudflare with proxy OFF (DNS only). Verification
# flips to SUCCESS within minutes of them resolving.
output "ses_dkim_records" {
  description = "Add each as a CNAME in Cloudflare, proxy disabled."
  value = [
    for t in aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens : {
      type  = "CNAME"
      name  = "${t}._domainkey.${var.domain_name}"
      value = "${t}.dkim.amazonses.com"
    }
  ]
}

# ---------------------------------------------------------------------------
# Custom MAIL FROM — aligns SPF with the From: domain.
# Requires two more Cloudflare records (also proxy OFF):
#   MX   mail.creechlabs.dev  ->  10 feedback-smtp.us-east-1.amazonses.com
#   TXT  mail.creechlabs.dev  ->  "v=spf1 include:amazonses.com ~all"
#
# NOTE: check `dig MX creechlabs.dev` first. If Cloudflare Email Routing owns
# the apex MX, the subdomain MX here is separate and will not conflict.
# ---------------------------------------------------------------------------
resource "aws_sesv2_email_identity_mail_from_attributes" "domain" {
  email_identity         = aws_sesv2_email_identity.domain.email_identity
  mail_from_domain       = "mail.${var.domain_name}"
  behavior_on_mx_failure = "USE_DEFAULT_VALUE"
}

# ---------------------------------------------------------------------------
# Event destination — this is the answer to "how do I check SES for details".
# Without it you are blind: get-send-statistics is a 15-minute aggregate and
# tells you nothing per-message. This emits Delivery/Bounce/Complaint/Reject
# as CloudWatch metrics dimensioned by configuration set, so it is graphable
# in Grafana alongside everything else.
# ---------------------------------------------------------------------------
resource "aws_sesv2_configuration_set_event_destination" "demo_cloudwatch" {
  configuration_set_name = aws_sesv2_configuration_set.demo.configuration_set_name
  event_destination_name = "cloudwatch"

  event_destination {
    enabled              = true
    matching_event_types = ["SEND", "DELIVERY", "BOUNCE", "COMPLAINT", "REJECT", "RENDERING_FAILURE"]

    cloud_watch_destination {
      dimension_configuration {
        dimension_name           = "ses:configuration-set"
        dimension_value_source   = "MESSAGE_TAG"
        default_dimension_value  = aws_sesv2_configuration_set.demo.configuration_set_name
      }
    }
  }
}

# ---------------------------------------------------------------------------
# After DKIM verifies, switch the From: address to the domain and keep your
# personal inbox as the recipient:
#
#   SES_FROM_ADDRESS  = "demo@${var.domain_name}"   # signed, aligned
#   DEMO_NOTIFY_EMAIL = var.demo_notify_email       # where it lands
#
# These are already separate env vars in lambda-demo-request.tf. The
# ses:Recipients IAM condition pins to demo_notify_email, so it still holds.
# Sandbox is unaffected: the recipient is a verified identity either way.
# ---------------------------------------------------------------------------
