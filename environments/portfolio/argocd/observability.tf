# ------------------------------------------------------------
# Observability namespace Secret
# ------------------------------------------------------------
resource "kubernetes_namespace" "observability" {
  metadata {
    name = "observability"
  }
}

# ------------------------------------------------------------
# Grafana admin credentials
# Referenced by argocd/apps/grafana/values.yaml via existingSecret
# Persists across destroy/apply since it's created fresh each time
# with the same value from terraform.tfvars / CodeBuild secret
# ------------------------------------------------------------
resource "kubernetes_secret" "grafana_admin" {
  metadata {
    name      = "grafana-admin-credentials"
    namespace = kubernetes_namespace.observability.metadata[0].name
  }

  data = {
    "admin-user"     = "admin"
    "admin-password" = var.ui_admin_password
  }

  type = "Opaque"
}
