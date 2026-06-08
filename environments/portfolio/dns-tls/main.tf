terraform {
  required_version = ">= 1.10.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}

# ------------------------------------------------------------
# Pull outputs from upstream layers
# ------------------------------------------------------------
data "aws_caller_identity" "current" {}

data "terraform_remote_state" "networking" {
  backend = "s3"
  config = {
    bucket = "${var.project_name}-tf-state-${data.aws_caller_identity.current.account_id}"
    key    = "environments/portfolio/networking/terraform.tfstate"
    region = var.aws_region
  }
}

data "terraform_remote_state" "eks" {
  backend = "s3"
  config = {
    bucket = "${var.project_name}-tf-state-${data.aws_caller_identity.current.account_id}"
    key    = "environments/portfolio/eks/terraform.tfstate"
    region = var.aws_region
  }
}

# ------------------------------------------------------------
# Route53 Hosted Zone
# ------------------------------------------------------------
resource "aws_route53_zone" "main" {
  name = var.domain_name
}

# ------------------------------------------------------------
# ACM Certificate
# ------------------------------------------------------------
resource "aws_acm_certificate" "main" {
  domain_name               = var.domain_name
  subject_alternative_names = ["*.${var.domain_name}"]
  validation_method         = "DNS"

  # Must create new cert before destroying old one on any changes
  lifecycle {
    create_before_destroy = true
  }
}

# ------------------------------------------------------------
# ACM DNS Validation Records
# ------------------------------------------------------------
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.main.zone_id
}

# Wait for ACM to validate — required before ALB can use the cert
resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}
