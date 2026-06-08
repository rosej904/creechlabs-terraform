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