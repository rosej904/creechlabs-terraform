# ------------------------------------------------------------
# IRSA Role — AWS Load Balancer Controller
# ------------------------------------------------------------
resource "aws_iam_role" "aws_lbc" {
  name = "${var.project_name}-aws-lbc"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = data.terraform_remote_state.eks.outputs.oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${replace(data.terraform_remote_state.eks.outputs.oidc_provider_url, "https://", "")}:sub" = "system:serviceaccount:kube-system:aws-load-balancer-controller"
          "${replace(data.terraform_remote_state.eks.outputs.oidc_provider_url, "https://", "")}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })
}

# AWS managed policy for the Load Balancer Controller
# Grants permissions to create/manage ALBs, target groups, listeners etc.
resource "aws_iam_policy" "aws_lbc" {
  name        = "${var.project_name}-aws-lbc"
  description = "IAM policy for AWS Load Balancer Controller"

  # This is the official AWS policy for the LBC
  policy = file("${path.module}/policies/aws-lbc-policy.json")
}

resource "aws_iam_role_policy_attachment" "aws_lbc" {
  role       = aws_iam_role.aws_lbc.name
  policy_arn = aws_iam_policy.aws_lbc.arn
}

# ------------------------------------------------------------
# IAM Role, Policy, Attacchment — Cluster Autoscaler
# ------------------------------------------------------------

resource "aws_iam_role" "cluster_autoscaler" {
  name = "${var.project_name}-cluster-autoscaler"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = data.terraform_remote_state.eks.outputs.oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${local.oidc_url}:sub" = "system:serviceaccount:kube-system:cluster-autoscaler"
          "${local.oidc_url}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_policy" "cluster_autoscaler" {
  name        = "${var.project_name}-cluster-autoscaler"
  description = "Allows Cluster Autoscaler to manage ASG scaling"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "autoscaling:DescribeAutoScalingGroups",
          "autoscaling:DescribeAutoScalingInstances",
          "autoscaling:DescribeLaunchConfigurations",
          "autoscaling:DescribeScalingActivities",
          "autoscaling:DescribeTags",
          "ec2:DescribeLaunchTemplateVersions",
          "ec2:DescribeInstanceTypes",
          "eks:DescribeNodegroup"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "autoscaling:SetDesiredCapacity",
          "autoscaling:TerminateInstanceInAutoScalingGroup"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "autoscaling:ResourceTag/k8s.io/cluster-autoscaler/enabled" = "true"
            "autoscaling:ResourceTag/k8s.io/cluster-autoscaler/${var.project_name}-cluster" = "owned"
          }
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "cluster_autoscaler" {
  role       = aws_iam_role.cluster_autoscaler.name
  policy_arn = aws_iam_policy.cluster_autoscaler.arn
}

# ------------------------------------------------------------
# IRSA Role — Mimir (metrics long-term storage)
#
# The IAM *policy* (bucket read/write permissions) already exists
# in the mimir-storage layer — it doesn't depend on the OIDC
# provider, so it's owned there permanently. Only the role/trust
# relationship lives here, since it must always point at whichever
# OIDC provider exists for today's cluster.
#
# Update the "sub" condition below once the Mimir Helm release's
# actual serviceAccountName is known — this assumes it deploys
# into the "observability" namespace as service account "mimir".
# ------------------------------------------------------------

data "terraform_remote_state" "mimir_storage" {
  backend = "s3"

  config = {
    bucket       = "${var.project_name}-tf-state-${data.aws_caller_identity.current.account_id}" # match your other backend.hcl values
    key          = "environments/portfolio/mimir-storage/terraform.tfstate"
    region       = var.aws_region
    use_lockfile = true
  }
}

resource "aws_iam_role" "mimir_irsa" {
  name = "${var.project_name}-mimir-irsa"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = data.terraform_remote_state.eks.outputs.oidc_provider_arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${local.oidc_url}:sub" = "system:serviceaccount:observability:mimir"
          "${local.oidc_url}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "mimir_irsa" {
  role       = aws_iam_role.mimir_irsa.name
  policy_arn = data.terraform_remote_state.mimir_storage.outputs.mimir_s3_access_policy_arn
}

# Once applied, annotate the Mimir Helm chart's service account with:
#   eks.amazonaws.com/role-arn: <aws_iam_role.mimir_irsa.arn>
