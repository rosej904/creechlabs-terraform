locals {
  common_tags = {
    Project    = var.project_name
    ManagedBy  = "terraform"
    Environment = "portfolio"
    Layer      = "mimir-storage"
    Persistent = "true"
  }
}
