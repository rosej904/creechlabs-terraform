# ------------------------------------------------------------
# AWS Load Balancer Controller
# ------------------------------------------------------------
resource "helm_release" "aws_lbc" {
  name       = "aws-load-balancer-controller"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  namespace  = "kube-system"
  version    = var.aws_lbc_version

  set {
    name  = "clusterName"
    value = data.terraform_remote_state.eks.outputs.cluster_name
  }

  set {
    name  = "serviceAccount.create"
    value = "true"
  }

  set {
    name  = "serviceAccount.name"
    value = "aws-load-balancer-controller"
  }

  # Annotate the service account with the IRSA role ARN
  # This is how the pod gets AWS credentials without static keys
  set {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = aws_iam_role.aws_lbc.arn
  }

  set {
    name  = "region"
    value = var.aws_region
  }

  set {
    name  = "vpcId"
    value = data.terraform_remote_state.networking.outputs.vpc_id
  }

  # Wait for LBC to be fully ready before Terraform considers this done
  wait          = true
  wait_for_jobs = true
  timeout       = 300

  depends_on = [
    aws_iam_role_policy_attachment.aws_lbc
  ]
}

# ------------------------------------------------------------
# External DNS — Cloudflare provider
# ------------------------------------------------------------
resource "helm_release" "external_dns" {
  name       = "external-dns"
  repository = "https://kubernetes-sigs.github.io/external-dns"
  chart      = "external-dns"
  namespace  = "kube-system"
  version    = var.external_dns_version

  set {
    name  = "provider"
    value = "cloudflare"
  }

  # Cloudflare authentication via the secret we created in main.tf
  set {
    name  = "env[0].name"
    value = "CF_API_TOKEN"
  }

  set {
    name  = "env[0].valueFrom.secretKeyRef.name"
    value = kubernetes_secret.cloudflare_token.metadata[0].name
  }

  set {
    name  = "env[0].valueFrom.secretKeyRef.key"
    value = "apiToken"
  }

  # Only manage records with this annotation on Ingress resources
  # prevents External DNS from touching unrelated DNS records
  set {
    name  = "txtOwnerId"
    value = var.project_name
  }

  set {
    name  = "domainFilters[0]"
    value = var.domain_name
  }

  set {
    name  = "serviceAccount.create"
    value = "true"
  }

  set {
    name  = "serviceAccount.name"
    value = "external-dns"
  }

  set {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = aws_iam_role.external_dns.arn
  }

  # Sync policy — upsert creates/updates records, never deletes
  # change to "sync" if you want External DNS to also delete records
  set {
    name  = "policy"
    value = "upsert-only"
  }

  set {
    name  = "logLevel"
    value = "info"
  }

  wait    = true
  timeout = 300

  depends_on = [
    helm_release.aws_lbc,
    kubernetes_secret.cloudflare_token
  ]
}