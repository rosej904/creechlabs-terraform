import StatusDot from './StatusDot'
import DiagramImage from './diagrams/DiagramImage'

const APP_LABELS = {
  argocd: 'ArgoCD',
  grafana: 'Grafana',
  otel_demo: 'OTel demo app',
}

export default function InfraDetail({ status, loading, error }) {
  return (
    <div>
      <DiagramImage name="infra" variant="full" className="w-full mb-6" alt="Infrastructure architecture diagram" />

      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
        Everything here is provisioned with Terraform across layered state
        files, deployed via CodeBuild, and triggered by EventBridge scedhuled. 
        The applications in the cluster are deployed via ArgoCD (ArgoCD deployed via terraform) using a GitOps app-of-apps pattern. The
        EKS cluster, its workloads, and all other infrastructure (ALBs, VPCs, Subnets, Routes, ASGs, etc) are destroyed every evening and
        rebuilt every weekday morning — the status below reflects that
        cycle in real time, not a static snapshot.
      </p>

      {loading && (
        <p className="text-sm text-[var(--color-text-tertiary)]">Checking live status…</p>
      )}
      {error && (
        <p className="text-sm text-[var(--color-status-down)]">
          Could not reach the status API: {error}
        </p>
      )}

      {status && (
        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-3">
            <span className="text-sm font-medium">EKS cluster</span>
            <StatusDot status={status.eks?.status} showLabel size="lg" />
          </div>

          {status.apps?.detail &&
            Object.entries(status.apps.detail).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-3"
              >
                <span className="text-sm font-medium">{APP_LABELS[key] ?? key}</span>
                <StatusDot status={value.status} showLabel size="lg" />
              </div>
            ))}
        </div>
      )}

      <div className="border-t border-[var(--color-border)] pt-5">
        <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-3 uppercase tracking-wide">
          Stack
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            'Terraform',
            'AWS EKS',
            'ArgoCD',
            'Cloudflare DNS',
            'CodeBuild',
            'EventBridge',
            'Lambda',
            'CloudFront',
          ].map((tag) => (
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
