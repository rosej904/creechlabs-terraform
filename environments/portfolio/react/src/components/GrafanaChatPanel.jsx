import StatusDot from './StatusDot'

const GRAFANA_URL =
  'https://grafana.creechlabs.dev/d/demo-pub/demo?orgId=2&kiosk&theme=dark'

export default function GrafanaChatPanel({ status }) {
  const grafanaStatus = status?.apps?.detail?.grafana?.status ?? (status ? 'down' : undefined)
  const isUp = grafanaStatus === 'up'

  return (
    <div className="h-full flex flex-col rounded-2xl" style={{ backgroundColor: '#0d1117' }}>
      {/* Context bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--color-border)] shrink-0 rounded-t-2xl overflow-visible">
        <i className="ti ti-chart-dots-3 text-sm text-[var(--color-accent)]" aria-hidden="true" />
        <p className="text-xs text-[var(--color-text-secondary)]">
          LLM observability demo: Online 9am-5pm ET &mdash; AI Workloads &middot; Metering - COMING SOON!
        </p>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <StatusDot status={grafanaStatus} tooltip={false} />
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {grafanaStatus === 'up' ? 'Status: Up' : grafanaStatus === 'down' ? 'Status: Degraded' : grafanaStatus === 'stopped' ? 'Status: Scheduled offline' : ''}
          </span>
        </div>
      </div>
        <div className="w-full flex-1 flex flex-col items-center justify-center gap-3 p-8 rounded-b-2xl">
          <i className="ti ti-moon text-3xl text-[var(--color-text-tertiary)]" aria-hidden="true" />
          {/* <p className="text-sm text-[var(--color-text-secondary)] text-center max-w-xs">
            Visit weekdays 9am–5pm ET to see the live LLM observability dashboard alongside this chat.
          </p> */}
          <p className="text-sm text-[var(--color-text-secondary)] text-center max-w-xs">
            COMING SOON!
          </p>
          <div className="mt-1 space-y-1 text-xs text-[var(--color-text-tertiary)] text-center">
            <p>LLM Observability · Real-time AI workload metering</p>
          </div>
        </div>
    </div>
  )
}
