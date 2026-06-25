import StatusDot from './StatusDot'

const GRAFANA_URL =
  'https://grafana.creechlabs.dev/d/demo-pub/demo?orgId=2&kiosk&theme=dark'

export default function GrafanaPanel({ status }) {
  const grafanaStatus = status?.apps?.detail?.grafana?.status ?? (status ? 'down' : undefined)
  const isUp = grafanaStatus === 'up'

  return (
    <div className="h-full flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
      {/* Context bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--color-border)] shrink-0 rounded-t-2xl overflow-visible relative z-10">
        <i className="ti ti-chart-dots-3 text-sm text-[var(--color-accent)]" aria-hidden="true" />
        <p className="text-xs text-[var(--color-text-secondary)]">
          Live observability demo &mdash; otel-demo app &middot; SLO burn-rate alerting &middot; Prometheus &middot; Loki &middot; Tempo
        </p>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <StatusDot status={grafanaStatus} tooltip={false} />
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {grafanaStatus === 'up' ? 'Status: Up' : grafanaStatus === 'down' ? 'Status: Degraded' : grafanaStatus === 'stopped' ? 'Status: Scheduled offline' : ''}
          </span>
        </div>
      </div>

      {isUp ? (
        <div className="flex-1 min-h-0 overflow-hidden rounded-b-2xl">
          <iframe
            title="Grafana live dashboard"
            src={GRAFANA_URL}
            className="w-full h-full bg-[var(--color-bg)]"
            style={{ minWidth: '1200px' }}
            loading="lazy"
            allow="fullscreen"
          />
        </div>
      ) : (
        <div className="w-full flex-1 flex flex-col items-center justify-center gap-3 p-8 rounded-b-2xl">
          <i className="ti ti-moon text-3xl text-[var(--color-text-tertiary)]" aria-hidden="true" />
          <p className="text-sm text-[var(--color-text-secondary)] text-center max-w-xs">
            Grafana is offline — the EKS cluster runs weekdays
            8:30am–5:00pm ET. Check back during business hours.
          </p>
          <div className="mt-2 space-y-1 text-xs text-[var(--color-text-tertiary)] text-center">
            <p>SLO burn-rate alerting · Multi-window multi-burn-rate</p>
            <p>Prometheus · Loki · Tempo · cross-datasource correlation</p>
          </div>
        </div>
      )}
    </div>
  )
}
