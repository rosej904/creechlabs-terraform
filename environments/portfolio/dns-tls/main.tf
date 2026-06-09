terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

data "aws_caller_identity" "current" {}

# ------------------------------------------------------------
# ACM Certificate
# ------------------------------------------------------------
resource "aws_acm_certificate" "main" {
  domain_name               = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# ------------------------------------------------------------
# Cloudflare DNS validation records
# ------------------------------------------------------------
resource "cloudflare_record" "acm_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name  = dvo.resource_record_name
      value = dvo.resource_record_value
      type  = dvo.resource_record_type
    }
    if dvo.domain_name == var.domain_name
  }

  zone_id         = var.cloudflare_zone_id
  name            = each.value.name
  content         = each.value.value
  type            = each.value.type
  ttl             = 60
  proxied         = false
  allow_overwrite = true 

  comment = "ACM certificate validation — managed by Terraform"
}

resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in cloudflare_record.acm_validation : record.hostname]
}
