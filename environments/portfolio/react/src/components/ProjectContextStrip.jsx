import { demoCopy } from '../config/demoMode'

const COLUMNS = [
  {
    icon: 'ti-alert-triangle',
    label: 'What?',
    detail: demoCopy.contextWhat,
  },
  {
    icon: 'ti-chart-dots-3',
    label: 'Why?',
    detail:
      'Showcase telemetry in context, overlaid with Continuous Reliability & SLO-driven operations concepts. (Also it is fun.)',
  },
  {
    icon: 'ti-refresh',
    label: 'How?',
    detail: demoCopy.contextHow,
  },
]

export default function ProjectContextStrip() {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 md:px-8 py-5 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-4 md:divide-x md:divide-[var(--color-border)]">
        {COLUMNS.map((col, i) => (
          <div key={col.label} className={`${i > 0 ? 'md:pl-8' : ''} flex flex-col gap-1.5`}>
            <div className="flex items-center gap-2 mb-1">
              <i className={`ti ${col.icon} text-base text-[var(--color-accent)]`} aria-hidden="true" />
              <p className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">
                {col.label}
              </p>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mr-2">
              {col.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
