# portfolio-ui Terraform layer

Hosts the creechlabs React/Vite portfolio frontend on S3 + CloudFront,
backed by a status-checker Lambda behind API Gateway. Applied manually
(NOT part of the daily CodeBuild apply/destroy cycle), same as
`dns-tls`, `cicd`, and `bootstrap`.

## Resources created

- S3 bucket (private, OAC-only) — holds the built React app
- CloudFront distribution — serves the app at `portfolio.creechlabs.dev`
  and `www.creechlabs.dev`, proxies `/api/*` to API Gateway
- API Gateway (HTTP API) + Lambda — status checker, `GET /api/status`
- IAM role for the Lambda (least privilege: `eks:DescribeCluster` on
  exactly `cl-portfolio-cluster`, plus basic CloudWatch logging)
- S3 bucket + CloudFront distribution for `creechlabs.com` -> `.dev` redirect
- Cloudflare DNS records (apex, www, portfolio subdomain, .com)

## Setup

```bash
cp terraform.tfvars.example terraform.tfvars
# fill in cloudflare_api_token and cloudflare_com_zone_id
terraform init -backend-config=backend.hcl
terraform plan
terraform apply
```

`backend.hcl` is gitignored

```hcl
bucket       = "s3-bucket-name"
key          = "state-key-name"
region       = "us-east-1"
use_lockfile = true
```

## ACM cert architecture

Two separate certs, both in `us-east-1` (CloudFront requirement), both managed in the `dns-tls` layer:

- **`acm_certificate_arn`** — wildcard `*.creechlabs.dev`. Used by the main portfolio distribution (`cloudfront.tf`) and by all ALB ingress (argocd/grafana/otel-demo).
- **`dotcom_acm_certificate_arn`** — covers `creechlabs.com` + `www.creechlabs.com` only. Used exclusively by `com-redirect.tf`. Deliberately **not** a SAN on the wildcard cert — kept fully separate since the `.com` redirect has no relationship to the `.dev` ALB ingress resources.

Set `dotcom_acm_certificate_arn` in this layer's `terraform.tfvars` from the `dns-tls` layer's `dotcom_acm_certificate_arn` output:

```bash
terraform output -raw dotcom_acm_certificate_arn  # run in dns-tls
```

## Deploy flow (once infra exists)

```bash
cd path/to/react-app
npm run build
aws s3 sync dist/ s3://cl-portfolio-ui-445606683808/ --delete
aws cloudfront create-invalidation \
  --distribution-id $(terraform output -raw cloudfront_distribution_id) \
  --paths "/*"
```

This will move into a `Makefile` target as part of the React app work.

## Notes

- Lambda checks `eks:DescribeCluster` against the exact cluster name —
  if the cluster doesn't exist (post-destroy), it correctly reports
  `"stopped"` rather than erroring, since `ResourceNotFoundException`
  is treated as the expected nightly-teardown state.
- Lambda is fronted by API Gateway
- All app reachability checks are skipped entirely once EKS is
  confirmed stopped, to avoid noisy timeouts against URLs that can't
  possibly resolve.
