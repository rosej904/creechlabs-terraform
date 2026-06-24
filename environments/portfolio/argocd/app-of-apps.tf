# ------------------------------------------------------------
# App of Apps — root ArgoCD Application
# ------------------------------------------------------------
resource "kubectl_manifest" "app_of_apps" {
  yaml_body = templatefile("${path.module}/bootstrap/app-of-apps.yaml", {
    github_repo_ssh_url    = var.github_repo_ssh_url
    target_revision        = var.github_branch
    ui_admin_password      = var.ui_admin_password
  })

  depends_on = [
    helm_release.argocd,
    kubernetes_secret.argocd_repo
  ]
}
