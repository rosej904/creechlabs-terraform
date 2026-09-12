###############################################################################
# SES — demo request notifications
#
# Lives in environments/portfolio/frontend because it is part of the frontend
# request path (CloudFront -> API Gateway -> Lambda -> SES) and must survive
# the CodeBuild apply/destroy cycle.
#
# Phase 1 (this file): verify one email identity, grant the API Lambda
# ses:SendEmail. The only recipient is you, so the SES sandbox is sufficient —
# no production access request, no DNS records, no DKIM.
#
# Phase 2 (see bottom): domain identity + DKIM, needed only when you want to
# send confirmation mail *to the requester*.
###############################################################################

# ─── Identity ────────────────────────────────────────────────────────────────
# Creating this sends a verification email to the address. Until you click the
# link, SendEmail calls fail with MessageRejected.
resource "aws_sesv2_email_identity" "demo_notify" {
  email_identity = var.demo_notify_email
}

# ─── Configuration set ───────────────────────────────────────────────────────
# Not strictly required, but it gives you bounce/complaint metrics in
# CloudWatch and a place to hang an event destination later.
resource "aws_sesv2_configuration_set" "demo" {
  configuration_set_name = "cl-portfolio-demo-requests"

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

# ─── Lambda permissions ──────────────────────────────────────────────────────
data "aws_iam_policy_document" "ses_send" {
  statement {
    sid    = "SendDemoRequestMail"
    effect = "Allow"
    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail",
    ]
    resources = [
      aws_sesv2_email_identity.demo_notify.arn,
      aws_sesv2_configuration_set.demo.arn,
    ]

    # Belt and braces: the Lambda can only ever mail you, even if the handler
    # is compromised or a bug lets a caller control the recipient.
    condition {
      test     = "ForAllValues:StringEquals"
      variable = "ses:Recipients"
      values   = [var.demo_notify_email]
    }
  }
}

resource "aws_iam_policy" "ses_send" {
  name   = "cl-portfolio-ses-send"
  policy = data.aws_iam_policy_document.ses_send.json
}

resource "aws_iam_role_policy_attachment" "lambda_ses_send" {
  role       = var.api_lambda_role_name
  policy_arn = aws_iam_policy.ses_send.arn
}

# ─── Wire into the Lambda ────────────────────────────────────────────────────
# Add these to the existing aws_lambda_function environment block:
#
#   environment {
#     variables = {
#       # ...existing...
#       SES_FROM_ADDRESS       = var.demo_notify_email
#       DEMO_NOTIFY_EMAIL      = var.demo_notify_email
#       SES_CONFIGURATION_SET  = aws_sesv2_configuration_set.demo.configuration_set_name
#     }
#   }

output "ses_identity_status" {
  description = "Check the inbox for a verification link if this is not SUCCESS."
  value       = aws_sesv2_email_identity.demo_notify.verified_for_sending_status
}

###############################################################################
# Phase 2 — domain identity (only when mailing requesters)
#
# resource "aws_sesv2_email_identity" "domain" {
#   email_identity = "creechlabs.dev"
# }
#
# output "dkim_records" {
#   description = "Add these three as CNAMEs in Cloudflare (proxy OFF / DNS only)."
#   value = [
#     for t in aws_sesv2_email_identity.domain.dkim_signing_attributes[0].tokens : {
#       name  = "${t}._domainkey.creechlabs.dev"
#       value = "${t}.dkim.amazonses.com"
#     }
#   ]
# }
#
# Then: request SES production access (support case, ~24h turnaround) since
# sandbox mode blocks sending to unverified addresses. Also add SPF
# (include:amazonses.com) and a DMARC record, or replies land in spam.
###############################################################################
