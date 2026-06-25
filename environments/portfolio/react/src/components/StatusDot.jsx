const STATUS_CONFIG = {
  up:      { color: 'bg-[var(--color-status-up)]',      label: 'Status: Up' },
  stopped: { color: 'bg-[var(--color-status-stopped)]', label: 'Status: Scheduled offline' },
  down:    { color: 'bg-[var(--color-status-down)]',    label: 'Status: Degraded' },
}

export default function StatusDot({ status, showLabel = false, size = 'sm', tooltip = true, tooltipPosition = 'center' }) {
  const config = STATUS_CONFIG[status] ?? { color: 'bg-[var(--color-text-tertiary)]', label: 'Unknown' }
  const dotSize = size === 'lg' ? 'w-2.5 h-2.5' : 'w-2 h-2'

  const tooltipAlign =
    tooltipPosition === 'right'  ? 'right-0 translate-x-0 left-auto' :
    tooltipPosition === 'left'   ? 'left-0 translate-x-0' :
    'left-1/2 -translate-x-1/2'

  const tooltipVertical =
    tooltipPosition === 'below'
      ? 'top-full mt-1.5 bottom-auto'
      : 'bottom-full mb-1.5'

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative group/dot inline-flex">
        <span
          className={`${dotSize} rounded-full ${config.color} shrink-0 block`}
          aria-label={config.label}
        />
        {tooltip && status && (
          <span
            className={`
              pointer-events-none absolute ${tooltipVertical}
              px-2 py-1 rounded-md text-xs whitespace-nowrap
              bg-[var(--color-bg)] border border-[var(--color-border)]
              text-[var(--color-text-primary)]
              opacity-0 group-hover/dot:opacity-100
              transition-opacity duration-150
              z-50 ${tooltipAlign}
            `}
          >
            {config.label}
          </span>
        )}
      </span>
      {showLabel && (
        <span className="text-xs text-[var(--color-text-secondary)]">{config.label}</span>
      )}
    </span>
  )
}
