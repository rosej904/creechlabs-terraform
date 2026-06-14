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