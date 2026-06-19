output "cloudflare_record_ids" {
  value = [
    for record in cloudflare_record.acm_validation : record.id
  ]
}

output "acm_certificate_arn" {
  description = "Wildcard ACM certificate ARN — used by all ALB ingress resources"
  value       = aws_acm_certificate.main.arn
}

output "certificate_status" {
  description = "ACM certificate validation status — must be ISSUED before ingress works"
  value       = aws_acm_certificate.main.status
}

output "domain_name" {
  description = "Primary domain name"
  value       = var.domain_name
}

output "dotcom_acm_certificate_arn" {
  description = "ACM certificate ARN for creechlabs.com + www.creechlabs.com — used only by portfolio-ui's com-redirect distribution"
  value       = aws_acm_certificate.dotcom.arn
}

output "dotcom_certificate_status" {
  description = "creechlabs.com ACM certificate validation status"
  value       = aws_acm_certificate.dotcom.status
}