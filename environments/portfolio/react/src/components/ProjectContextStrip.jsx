const COLUMNS = [
  {
    icon: 'ti-alert-triangle',
    label: 'What?',
    detail: 'Production-grade observability on a $0/day budget — EKS, ArgoCD, and the full LGTM stack rebuilt automatically every morning and torn down every night.',
  },
  {
    icon: 'ti-chart-dots-3',
    label: 'Why?',
    detail: 'Showcase telemetry in context overlaid with Continuous Reliability & SLO-Driven Operations concepts! (also its fun)',
  },
  {
    icon: 'ti-refresh',
    label: 'How?',
    detail: 'Fully ephemeral - EKS, networking, and all workloads are declared in Terraform and ArgoCD. The entire stack is torn down at 5pm ET and rebuilt from scratch at 8:30am — automatically, every weekday.',
  },
  // {
  //   icon: 'ti-chart-dots-3',
  //   label: 'Label?',
  //   summary: 'Summary',
  //   detail: 'Details',
  // },
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
            <p className="text-sm font-medium text-[var(--color-text-primary)] leading-snug">
              {col.summary}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mr-2">
              {col.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
