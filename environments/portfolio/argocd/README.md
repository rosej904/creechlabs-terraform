# ArgoCD Layer Setup

## NOTE: Helm Chart Value yaml files have hardcoded values

## One-time manual steps before first apply

### 1. Generate SSH deploy key

```bash
ssh-keygen -t ed25519 -C "argocd-deploy-key" -f argocd_deploy_key -N ""
```

This creates two files:
- `argocd_deploy_key` (private key — goes into terraform.tfvars)
- `argocd_deploy_key.pub` (public key — goes into GitHub)

### 2. Add public key to GitHub

```
GitHub repo → Settings → Deploy keys → Add deploy key
  Title: argocd-readonly
  Key: <paste contents of argocd_deploy_key.pub>
  Allow write access: NO (read-only is sufficient)
```

### 3. Add private key + other values to terraform.tfvars

```hcl
github_repo_ssh_url         = "git@github.com:YOUR_USERNAME/YOUR_REPO.git"
ui_admin_password           = "your-chosen-password"
```
export TF_VAR_argocd_repo_ssh_private_key=$(cat /path/to/your/id_rsa)

### 4. For CodeBuild — store both as secrets or add to cicd/main.tf and apply

```bash
aws secretsmanager create-secret \
  --name "cl-portfolio/ui_admin_password" \
  --secret-string "your-chosen-password"

aws secretsmanager create-secret \
  --name "cl-portfolio/argocd_repo_ssh_private_key" \
  --secret-string "file:///path/to/argocd_deploy_key"
```

Then add to `cicd/main.tf` CodeBuild environment variables (SECRETS_MANAGER type)
and export as `TF_VAR_ui_admin_password` / `TF_VAR_argocd_repo_ssh_private_key`
in the buildspec pre_build phase.

---

## Apply

```bash
cd environments/portfolio/argocd
terraform init -backend-config=backend.hcl
terraform apply
```

## Verify

```bash
# check ArgoCD pods
kubectl get pods -n argocd

# check ingress got an ALB
kubectl get ingress -n argocd

# check app-of-apps synced
kubectl get applications -n argocd
```

## Access ArgoCD UI

```
https://argocd.creechlabs.dev

Username: admin
Password: <value from ui_admin_password>
```

## CLI login (optional)

```bash
argocd login argocd.creechlabs.dev
```

---

## Adding new apps going forward

No Terraform changes needed. Just add a new folder under `argocd/apps/`:

```
argocd/apps/
  └── my-new-app/
        ├── application.yaml   ← ArgoCD Application CRD
        └── values.yaml        ← Helm values (if using a Helm chart)
```

Commit and push — app-of-apps auto-discovers it within ~3 minutes (default sync interval).