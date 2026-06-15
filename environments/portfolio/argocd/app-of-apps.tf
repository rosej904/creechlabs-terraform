# ------------------------------------------------------------
# App of Apps — root ArgoCD Application
#
# This is the ONLY Application Terraform creates directly.
# It points at argocd/apps/ in your repo — ArgoCD then
# auto-discovers and syncs every child Application defined there.
#
# Adding a new app = adding a folder under argocd/apps/ in git.
# No Terraform changes needed for new apps going forward.
# ------------------------------------------------------------
resource "kubectl_manifest" "app_of_apps" {
  yaml_body = templatefile("${path.module}/bootstrap/app-of-apps.yaml", {
    github_repo_ssh_url = var.github_repo_ssh_url
    target_revision     = var.github_branch
  })

  depends_on = [
    helm_release.argocd,
    kubernetes_secret.argocd_repo
  ]
}
