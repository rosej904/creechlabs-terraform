# ------------------------------------------------------------
# SSH deploy key secret — ArgoCD uses this to clone your repo
#
# Setup required (one time, manual):
#   1. Generate a keypair:
#        ssh-keygen -t ed25519 -C "argocd-deploy-key" -f argocd_deploy_key -N ""
#   2. Add the PUBLIC key (argocd_deploy_key.pub) to GitHub:
#        Repo → Settings → Deploy keys → Add deploy key
#        Read-only access is sufficient
#   3. Store the PRIVATE key content in terraform.tfvars / CodeBuild secret
#        as argocd_repo_ssh_private_key
# ------------------------------------------------------------
resource "kubernetes_secret" "argocd_repo" {
  metadata {
    name      = "argocd-repo-creechlabs-terraform"
    namespace = kubernetes_namespace.argocd.metadata[0].name

    labels = {
      "argocd.argoproj.io/secret-type" = "repository"
    }
  }

  data = {
    type          = "git"
    url           = var.github_repo_ssh_url
    sshPrivateKey = var.argocd_repo_ssh_private_key
  }

  type = "Opaque"
}
