# ------------------------------------------------------------
# ArgoCD Helm Release
# ------------------------------------------------------------
resource "helm_release" "argocd" {
  name       = "argocd"
  repository = "https://argoproj.github.io/argo-helm"
  chart      = "argo-cd"
  namespace  = kubernetes_namespace.argocd.metadata[0].name
  version    = var.argocd_chart_version

  values = [
    templatefile("${path.module}/values/argocd-values.yaml", {
      acm_certificate_arn = data.terraform_remote_state.dns_tls.outputs.acm_certificate_arn
      domain_name         = data.terraform_remote_state.dns_tls.outputs.domain_name
      admin_password_hash = bcrypt(var.argocd_admin_password)
    })
  ]

  wait    = true
  timeout = 600

  depends_on = [
    kubernetes_secret.argocd_repo
  ]
}