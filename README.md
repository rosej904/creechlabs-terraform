# terraform-portfolio

Infrastructure as Code for portfolio/demo EKS cluster on AWS.

## Architecture

```
bootstrap/      → S3 + DynamoDB for TF remote state (apply once, never destroy)
networking/     → VPC, subnets, IGW, NAT Gateway, route tables
eks/            → EKS cluster, node group, IAM roles, OIDC, EBS CSI driver
```

## Prerequisites

- Terraform >= 1.6.0
- AWS CLI configured (`aws configure`)
- kubectl
- IAM user with AdministratorAccess

---

## First-Time Setup - local

### Step 1 — Bootstrap (run once only)

```bash
cd bootstrap

# Get your account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Update terraform.tfvars with your account ID
sed -i "s/YOUR_ACCOUNT_ID_HERE/$AWS_ACCOUNT_ID/" terraform.tfvars

terraform init
terraform apply
```

Note the output values. Then update the backend bucket name in:
- `networking/main.tf` → replace `YOUR_ACCOUNT_ID_HERE`
- `eks/main.tf` → replace `YOUR_ACCOUNT_ID_HERE`

### Step 2 — Networking

```bash
cd ../networking
terraform init
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