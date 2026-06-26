import DiagramImage from './diagrams/DiagramImage'

export default function DevopsDetail() {
  return (
    <div>
      <DiagramImage name="devops" variant="full" className="w-full mb-6" alt="DevOps and delivery architecture diagram" />

      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
        ArgoCD is Deployed and fully configured via Terraform/Helm and continuously reconciles the cluster against
        what's defined in source using an app-of-apps pattern and GitOps practices. ArgoCD, all applications, kubernetes resources
        are included in the daily teardown.
      </p>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
        EKS Infra/App layer stands up the external DNS and AWS LBC components to 
        automatically detect ingress resources that are created/updated during ArgoCD state sync to provision ALB, 
        corresponding CNAME records in Cloudflare, and sync ACM certs.
      </p>

      <div className="border-t border-[var(--color-border)] pt-5">
        <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-3 uppercase tracking-wide">
          Stack
        </p>
        <div className="flex flex-wrap gap-2">
          {['GitHub', 'CodeBuild', 'Terraform', 'ArgoCD', 'Helm', 'Cloudflare', 'External DNS', 'AWS LBC'].map((tag) => (
            <span
              key={tag}
              className="text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-2.5 py-1 text-[var(--color-text-secondary)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
