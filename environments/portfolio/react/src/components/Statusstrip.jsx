import StatusDot from './StatusDot'

const STATUS_ITEMS = [
  { key: 'eks', label: 'EKS' },
  { key: 'argocd', label: 'ArgoCD' },
  { key: 'grafana', label: 'Grafana' },
  { key: 'otel_demo', label: 'OTel demo' },
]

function resolveStatus(status, key) {
  if (!status) return undefined
  if (key === 'eks') return status.eks?.status
  return status.apps?.detail?.[key]?.status
}

export default function StatusStrip({ status }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-8 py-4 mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
      {STATUS_ITEMS.map((item) => (
        <div key={item.key} className="flex items-center gap-2">
          <StatusDot status={resolveStatus(status, item.key)} />
          <span className="text-xs text-[var(--color-text-secondary)]">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
