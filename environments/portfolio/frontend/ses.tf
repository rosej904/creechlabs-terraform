###############################################################################
# SES — demo request notifications
#
# Colocated in the frontend layer, same as lambda-chatbot.tf: the whole path is
# CloudFront -> aws_apigatewayv2_api.status_api -> Lambda -> SES.
#
# Phase 1 (this file): verify one email identity, nothing else. The only
# recipient is you, so the SES sandbox is sufficient — no production access
# request, no domain verification, no DKIM records in Cloudflare.
#
# Phase 2 (bottom of file): domain identity + DKIM, needed only if you later
# want to send confirmation mail to the requester.
###############################################################################

variable "demo_notify_email" {
  description = "Address that receives demo requests. Must be a real inbox — SES sends a verification link to it."
  type        = string
}

# --- Identity ---------------------------------------------------------------
# Creating this triggers a verification email. Until you click the link,
# SendEmail fails with MessageRejected.
resource "aws_sesv2_email_identity" "demo_notify" {
  email_identity = var.demo_notify_email
}

# --- Configuration set ------------------------------------------------------
# Gives you bounce/complaint metrics in CloudWatch and somewhere to hang an
# event destination later. Cheap insurance on a public endpoint.
resource "aws_sesv2_configuration_set" "demo" {
  configuration_set_name = "${var.project_name}-demo-requests"

  delivery_options {
    tls_policy = "REQUIRE"
  }

  reputation_options {
    reputation_metrics_enabled = true
  }

  sending_options {
    sending_enabled = true
  }
}

output "ses_identity_status" {
  description = "Check the inbox for a verification link if this is not SUCCESS."
  value       = aws_sesv2_email_identity.demo_notify.verified_for_sending_status
}

###############################################################################
# Phase 2 - domain identity (only when mailing requesters)
#
# resource "aws_sesv2_email_identity" "domain" {
#   email_identity = var.domain_name
# }
#
# output "dkim_records" {
#   description = "Add as CNAMEs in Cloudflare with proxy OFF (DNS only)."
#   value = [
#     for t in aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens : {
#       name  = "${t}._domainkey.${var.domain_name}"
#       value = "${t}.dkim.amazonses.com"
#     }
#   ]
# }
#
# Then request SES production access (support case, ~24h) since sandbox blocks
# sending to unverified addresses. Add SPF (include:amazonses.com) and DMARC,
# or replies land in spam.
###############################################################################
