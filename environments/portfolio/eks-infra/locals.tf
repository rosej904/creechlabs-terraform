locals {
  common_tags = {
    Project     = var.project_name
    ManagedBy   = "terraform"
    Environment = "portfolio"
    Layer       = "eks-infra"
  }

  oidc_url = replace(data.terraform_remote_state.eks.outputs.oidc_provider_url, "https://", "")
}