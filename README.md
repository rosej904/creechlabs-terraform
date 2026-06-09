# terraform-portfolio

Infrastructure as Code for portfolio/demo EKS cluster on AWS.

## Architecture

```
--Apply Once, Never Destroy--
bootstrap/      S3 with native state locking enabled
ci/cd/          Codebuild projects, buildspecs, Eventbridge schedules, IAM roles
dns-tls/        ACM certs, Cloudflare cname Record, logical validation

--Created & Destroyed per Event Bridge Cycle (Daily)--
networking/     VPC, subnets, IGW, NAT Gateway, route tables
eks/            EKS cluster, node group, IAM roles, OIDC, EBS CSI driver
eks-infra/      AWS LBC for ingress, external dns cloudflare provider
```

## Prerequisites

- Terraform >= 1.6.0
- AWS CLI configured (`aws configure`)
- kubectl
- IAM user with AdministratorAccess (or minimal permissions required)

---

## First-Time Setup - local

### Step 1 — Bootstrap (run once only)

# Get your account ID
Get from console or 'export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)'

# Update terraform.tfvars with your account ID, you can use below or do it manually
sed -i "s/YOUR_ACCOUNT_ID_HERE/$AWS_ACCOUNT_ID/" terraform.tfvars

```bash
cd bootstrap
terraform init
terraform apply
```

# Note the outputs from above apply and update backend.hcl in respective dirs
# Apply Manually - These components are not part of the daily apply/destroy

```bash
cd ../cicd
terraform init -backend-config=backend.hcl
terraform apply
```

```bash
cd ../dns-tls
terraform init -backend-config=backend.hcl
terraform apply
# Takes ~15 minutes
```

### Configure kubectl

```bash
# Command is printed as an output, or run:
aws eks update-kubeconfig --region us-east-1 --name portfolio-cluster

# Verify
kubectl get nodes
```

---

## Destroy Everything (tear down to zero cost)+
Destroy in reverse order — Do not destroy bootstrap.

## Networking, EKS, DNS, EKS-INFRA
# Note - these components are created and destroyed in codebuild projects daily but can also be managed from local

# Note - For eks-infra or any local terraform job that needs access within the cluster (the service role used in codebuild solves this), you can add 'eks_admin_users = ["iam-user-name"]' in ...eks/terraform.tfvars and then apply. This will create an aws_eks_access_entry for this user and allowing user to run terraform apply to access within the cluster.