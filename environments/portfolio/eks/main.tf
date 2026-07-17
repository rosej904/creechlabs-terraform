terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}

# ------------------------------------------------------------
# Pull networking outputs from remote state
# ------------------------------------------------------------
data "aws_caller_identity" "current" {}

data "terraform_remote_state" "networking" {
  backend = "s3"
  config = {
    bucket = "${var.project_name}-tf-state-${data.aws_caller_identity.current.account_id}"
    key    = "environments/portfolio/networking/terraform.tfstate"
    region = var.aws_region
  }
}

# Looked up by tag rather than referencing networking's subnet_ids list by
# index/position, since that list's ordering isn't guaranteed to be stable
# across applies. Matches the "<project>-private-<az>" naming convention
# used by the networking layer (e.g. "cl-portfolio-private-us-east-1a").
data "aws_subnet" "node_group_az" {
  vpc_id = local.vpc_id

  filter {
    name   = "tag:Name"
    values = ["${var.project_name}-private-${var.node_group_availability_zone}"]
  }
}

locals {
  vpc_id             = data.terraform_remote_state.networking.outputs.vpc_id
  private_subnet_ids = data.terraform_remote_state.networking.outputs.private_subnet_ids
  public_subnet_ids  = data.terraform_remote_state.networking.outputs.public_subnet_ids

  # Single private subnet for node groups, pinned to the same AZ as the
  # NAT Gateway. Keeps EBS-backed StatefulSets (Prometheus/Loki/Tempo)
  # from ending up in an AZ with no running nodes, and avoids cross-AZ
  # data transfer on node egress. Looked up dynamically since the VPC
  # (and its subnet IDs) is fully recreated every night.
  single_az_private_subnet_id = data.aws_subnet.node_group_az.id

  common_tags = {
    Project     = var.project_name
    ManagedBy   = "terraform"
    Environment = "portfolio"
    Layer       = "eks"
  }
}

# ------------------------------------------------------------
# IAM — EKS Cluster Role
# ------------------------------------------------------------
resource "aws_iam_role" "eks_cluster" {
  name = "${var.project_name}-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role_policy_attachment" "eks_vpc_resource_controller" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks_cluster.name
}

# ------------------------------------------------------------
# IAM — Node Group Role
# ------------------------------------------------------------
resource "aws_iam_role" "eks_nodes" {
  name = "${var.project_name}-eks-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_nodes.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_nodes.name
}

resource "aws_iam_role_policy_attachment" "eks_ecr_readonly" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_nodes.name
}

# Required for EBS CSI driver on nodes
resource "aws_iam_role_policy_attachment" "eks_ebs_csi_policy" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
  role       = aws_iam_role.eks_nodes.name
}

# ------------------------------------------------------------
# # IAM Role, Policy, and Group that any principal can assume to get console access & bound to cluster admin role
# ------------------------------------------------------------
resource "aws_iam_role" "eks_console_admin" {
  name = "${var.project_name}-eks-console-admin"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = {
        AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = local.common_tags
}

# Bind that role to Kubernetes cluster-admin via Access Entries
resource "aws_eks_access_entry" "console_admin" {
  cluster_name  = aws_eks_cluster.main.name
  principal_arn = aws_iam_role.eks_console_admin.arn
  type          = "STANDARD"
}

resource "aws_eks_access_policy_association" "console_admin" {
  cluster_name  = aws_eks_cluster.main.name
  principal_arn = aws_iam_role.eks_console_admin.arn
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"

  access_scope {
    type = "cluster"
  }
}

# IAM Policy that get attached to eks admin role
resource "aws_iam_policy" "eks_console_admin_assume" {
  name        = "${var.project_name}-eks-console-admin-assume"
  description = "Allows assumption of the EKS console admin role. Attach to any IAM user or group that needs Kubernetes console access."

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid      = "AssumeEKSConsoleAdminRole"
      Effect   = "Allow"
      Action   = "sts:AssumeRole"
      Resource = aws_iam_role.eks_console_admin.arn
    }]
  })

  tags = local.common_tags
}

# Grant local IAM users kubectl access directly for local testing 
resource "aws_eks_access_entry" "admin_users" {
  for_each = toset(var.eks_admin_users)

  cluster_name      = aws_eks_cluster.main.name
  principal_arn     = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/${each.value}"
  type              = "STANDARD"
}

resource "aws_eks_access_policy_association" "admin_users" {
  for_each = toset(var.eks_admin_users)

  cluster_name  = aws_eks_cluster.main.name
  principal_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/${each.value}"
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"

  access_scope {
    type = "cluster"
  }
}

# Create the IAM Group for eks admins
resource "aws_iam_group" "assume_role_group" {
  name = "${var.project_name}-eks-console-admins"
  path = "/"
}

# Attach your existing Policy to the Group
resource "aws_iam_group_policy_attachment" "attach_existing_policy" {
  group      = aws_iam_group.assume_role_group.name
  policy_arn = aws_iam_policy.eks_console_admin_assume.arn
}

resource "aws_iam_policy" "eks_console_read" {
  name        = "${var.project_name}-eks-console-read"
  description = "Allows read-only EKS API access for console viewing"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "EKSConsoleRead"
      Effect = "Allow"
      Action = [
        "eks:ListClusters",
        "eks:DescribeCluster",
        "eks:ListNodegroups",
        "eks:DescribeNodegroup",
        "eks:ListAddons",
        "eks:DescribeAddon",
        "eks:AccessKubernetesApi",
        "eks:DescribeClusterVersions"
      ]
      Resource = "*"
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "eks_console_read" {
  role       = aws_iam_role.eks_console_admin.name
  policy_arn = aws_iam_policy.eks_console_read.arn
}

# ------------------------------------------------------------
# Security Group — Cluster control plane
# ------------------------------------------------------------
resource "aws_security_group" "eks_cluster" {
  name        = "${var.project_name}-eks-cluster-sg"
  description = "EKS cluster control plane security group"
  vpc_id      = local.vpc_id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-eks-cluster-sg"
  })
}

# ------------------------------------------------------------
# EKS Cluster
# ------------------------------------------------------------
resource "aws_eks_cluster" "main" {
  name     = "${var.project_name}-cluster"
  role_arn = aws_iam_role.eks_cluster.arn
  version  = var.kubernetes_version

  access_config {
    authentication_mode                         = "API_AND_CONFIG_MAP"
    bootstrap_cluster_creator_admin_permissions = true
  }

  vpc_config {
    subnet_ids              = concat(local.private_subnet_ids, local.public_subnet_ids)
    security_group_ids      = [aws_security_group.eks_cluster.id]
    endpoint_private_access = true
    endpoint_public_access  = true  # Set to false once you have a bastion/VPN
  }

  # Enable control plane logging
  enabled_cluster_log_types = ["api", "audit", "authenticator"]

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller,
  ]

  tags = local.common_tags
}

# ------------------------------------------------------------
# OIDC Provider — enables IRSA (IAM Roles for Service Accounts)
# Required for AWS Load Balancer Controller, External DNS, etc.
# ------------------------------------------------------------
data "tls_certificate" "eks" {
  url = aws_eks_cluster.main.identity[0].oidc[0].issuer
}

resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.main.identity[0].oidc[0].issuer

  tags = local.common_tags
}

# ------------------------------------------------------------
# Managed Node Group — On-Demand "stable" pool
# Small, fixed-size pool for stateful/critical workloads (e.g. Grafana)
# that shouldn't be disrupted by Spot reclaims.
# ------------------------------------------------------------
resource "aws_eks_node_group" "stable" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.project_name}-stable-ondemand"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = [local.single_az_private_subnet_id]

  instance_types = [var.stable_node_instance_type]
  capacity_type  = "ON_DEMAND"

  scaling_config {
    desired_size = var.stable_node_desired_count
    min_size     = var.stable_node_min_count
    max_size     = var.stable_node_max_count
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    "node-lifecycle" = "on-demand"
  }

  ami_type  = "AL2023_x86_64_STANDARD"
  disk_size = 20 # GB — keep small to save cost

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_ecr_readonly,
    aws_eks_addon.vpc_cni, # ensure prefix delegation is configured before nodes bootstrap
  ]

  tags = merge(local.common_tags, {
    "k8s.io/cluster-autoscaler/enabled"                     = "true"
    "k8s.io/cluster-autoscaler/${var.project_name}-cluster" = "owned"
  })

  lifecycle {
    ignore_changes = [scaling_config[0].desired_size]
  }
}

# ------------------------------------------------------------
# Managed Node Group — Spot "general" pool
# Bulk capacity for everything else. Untainted so it's the default
# scheduling target for any workload with no explicit placement rule.
# Multiple similar instance types improve Spot allocation/availability.
# ------------------------------------------------------------
resource "aws_eks_node_group" "spot" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.project_name}-spot-general"
  node_role_arn   = aws_iam_role.eks_nodes.arn
  subnet_ids      = [local.single_az_private_subnet_id]

  instance_types = var.spot_node_instance_types
  capacity_type  = "SPOT"

  scaling_config {
    desired_size = var.spot_node_desired_count
    min_size     = var.spot_node_min_count
    max_size     = var.spot_node_max_count
  }

  update_config {
    max_unavailable = 1
  }

  labels = {
    "node-lifecycle" = "spot"
  }

  ami_type  = "AL2023_x86_64_STANDARD"
  disk_size = 20 # GB — keep small to save cost

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_ecr_readonly,
    aws_eks_addon.vpc_cni, # ensure prefix delegation is configured before nodes bootstrap
  ]

  tags = merge(local.common_tags, {
    "k8s.io/cluster-autoscaler/enabled"                     = "true"
    "k8s.io/cluster-autoscaler/${var.project_name}-cluster" = "owned"
  })

  lifecycle {
    ignore_changes = [scaling_config[0].desired_size]
  }
}

# ------------------------------------------------------------
# EKS Add-ons
# CoreDNS, kube-proxy, vpc-cni, ebs-csi — all managed by AWS
# ------------------------------------------------------------
resource "aws_eks_addon" "coredns" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "coredns"
  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "OVERWRITE"

  depends_on = [aws_eks_node_group.stable, aws_eks_node_group.spot]
  tags       = local.common_tags
}

resource "aws_eks_addon" "kube_proxy" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "kube-proxy"
  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "OVERWRITE"

  tags = local.common_tags
}

resource "aws_eks_addon" "vpc_cni" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "vpc-cni"
  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "OVERWRITE"

  # Enable prefix delegation so managed node groups auto-calculate a much
  # higher max-pods ceiling (t3.medium: 17 -> 110) instead of the default
  # ENI/secondary-IP based limit. Must be applied before any node group
  # is created so nodes bootstrap with the correct value from launch —
  # see depends_on added to aws_eks_node_group.stable and .spot below.
  configuration_values = jsonencode({
    env = {
      ENABLE_PREFIX_DELEGATION = "true"
      WARM_PREFIX_TARGET       = "1"
    }
  })

  tags = local.common_tags
}

resource "aws_eks_addon" "ebs_csi_driver" {
  cluster_name                = aws_eks_cluster.main.name
  addon_name                  = "aws-ebs-csi-driver"
  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "OVERWRITE"

  # Use node role for EBS CSI (simpler than IRSA for now)
  service_account_role_arn = aws_iam_role.ebs_csi_irsa.arn

  depends_on = [aws_eks_node_group.stable, aws_eks_node_group.spot]
  tags       = local.common_tags
}

# ------------------------------------------------------------
# IRSA Role — EBS CSI Driver
# Best practice: pod-level IAM via service account annotation
# ------------------------------------------------------------
resource "aws_iam_role" "ebs_csi_irsa" {
  name = "${var.project_name}-ebs-csi-irsa"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.eks.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub" = "system:serviceaccount:kube-system:ebs-csi-controller-sa"
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ebs_csi_irsa_policy" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
  role       = aws_iam_role.ebs_csi_irsa.name
}
