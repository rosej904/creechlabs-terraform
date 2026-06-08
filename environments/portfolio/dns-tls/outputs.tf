output "hosted_zone_id" {
  description = "Route53 hosted zone ID — consumed by argocd and other layers for DNS records"
  value       = aws_route53_zone.main.zone_id
}

output "hosted_zone_name_servers" {
  description = "Add these 4 NS records at your registrar to delegate DNS to Route53"
  value       = aws_route53_zone.main.name_servers
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

output "nameserver_delegation_instructions" {
  description = "Instructions for your registrar"
  value       = "Go to your registrar for ${var.domain_name} and set custom nameservers to the 4 values in hosted_zone_name_servers"
}