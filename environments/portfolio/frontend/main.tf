terraform {
  required_version = ">= 1.7.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "creechlabs"
      ManagedBy = "terraform"
      Layer     = "portfolio-ui"
    }
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project   = "creechlabs"
      ManagedBy = "terraform"
      Layer     = "portfolio-ui"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}


# ------------------------------------------------------------
# Remote state — pull outputs from upstream layers
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

data "terraform_remote_state" "dnstls" {
  backend = "s3"
  config = {
    bucket = "${var.project_name}-tf-state-${data.aws_caller_identity.current.account_id}"
    key    = "environments/portfolio/dnstls/terraform.tfstate"
    region = var.aws_region
  }
}