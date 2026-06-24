const STATUS_CONFIG = {
  up: { color: 'bg-[var(--color-status-up)]', label: 'Up' },
  stopped: { color: 'bg-[var(--color-status-stopped)]', label: 'Scheduled offline' },
  down: { color: 'bg-[var(--color-status-down)]', label: 'Degraded' },
}

export default function StatusDot({ status, showLabel = false, size = 'sm' }) {
  const config = STATUS_CONFIG[status] ?? { color: 'bg-[var(--color-text-tertiary)]', label: 'Unknown' }
  const dotSize = size === 'lg' ? 'w-2.5 h-2.5' : 'w-2 h-2'

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`${dotSize} rounded-full ${config.color} shrink-0`} aria-hidden="true" />
      {showLabel && (
        <span className="text-xs text-[var(--color-text-secondary)]">{config.label}</span>
      )}
    </span>
  )
}