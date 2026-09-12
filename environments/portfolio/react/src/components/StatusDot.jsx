import { statusLabel } from '../config/demoMode'

const STATUS_COLORS = {
  up:           'bg-[var(--color-status-up)]',
  stopped:      'bg-[var(--color-status-stopped)]',
  down:         'bg-[var(--color-status-down)]',
  // No dedicated CSS var needed — accent reads as "in progress" and pulses.
  provisioning: 'bg-[var(--color-accent)] animate-pulse',
}

export default function StatusDot({ status, showLabel = false, size = 'sm', tooltip = true, tooltipPosition = 'center' }) {
  // Label text lives in config/demoMode so 'stopped' reads correctly in both
  // scheduled and on-demand modes.
  const color = STATUS_COLORS[status] ?? 'bg-[var(--color-text-tertiary)]'
  const label = statusLabel(status) || 'Status: Unknown'
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
          className={`${dotSize} rounded-full ${color} shrink-0 block`}
          aria-label={label}
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
            {label}
          </span>
        )}
      </span>
      {showLabel && (
        <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>
      )}
    </span>
  )
}
