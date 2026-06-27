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

export default function StatusStrip({ status, onTopologyClick }) {
  const eksUp = resolveStatus(status, 'eks') === 'up'

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 md:px-8 py-3 md:py-4 mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
      {STATUS_ITEMS.map((item) => (
        <div key={item.key} className="flex items-center gap-2">
          <StatusDot status={resolveStatus(status, item.key)} />
          <span className="text-xs text-[var(--color-text-secondary)]">{item.label}</span>
        </div>
      ))}

      {eksUp && onTopologyClick && (
        <button
          onClick={onTopologyClick}
          className="ml-auto hidden md:flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
        >
          <i className="ti ti-table text-sm text-[var(--color-accent)]" aria-hidden="true" />
          View live resources
        </button>
      )}
    </div>
  )
}
