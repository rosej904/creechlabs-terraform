# terraform-portfolio

Infrastructure as Code for portfolio/demo EKS cluster on AWS.

## Architecture

```
bootstrap/      S3 with native state locking enabled
networking/     VPC, subnets, IGW, NAT Gateway, route tables
eks/            EKS cluster, node group, IAM roles, OIDC, EBS CSI driver
cicd/           Codebuild projects, IAM roles, buildspecs, Eventbridges schedules
dns-tls/        Route53 Hosted Zones, ACM Cert & Validations
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
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Update terraform.tfvars with your account ID, you can use below
sed -i "s/YOUR_ACCOUNT_ID_HERE/$AWS_ACCOUNT_ID/" terraform.tfvars

```bash
cd bootstrap

terraform init
terraform apply
```


## Backend note before applying below
# Note the outputs from above apply and update backend.hcl in respective dirs


### Step 2 — Networking

```bash
cd ../networking
terraform init -backend-config=backend.hcl
terraform apply
```

### Step 3 — EKS Cluster

```bash
cd ../eks
terraform init
terraform apply
# Takes ~15 minutes
```

### Step 4 — Configure kubectl

```bash
# Command is printed as an output, or run:
aws eks update-kubeconfig --region us-east-1 --name portfolio-cluster

# Verify
kubectl get nodes
```

---

## Destroy Everything (tear down to zero cost)

Destroy in reverse order — never destroy bootstrap.

```bash
cd eks && terraform destroy
cd ../networking && terraform destroy
# Do NOT destroy bootstrap — it holds all state
```