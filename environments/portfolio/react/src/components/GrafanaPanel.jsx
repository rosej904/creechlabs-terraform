import StatusDot from './StatusDot'
import DemoShowcase from './DemoShowcase'
import { IS_ON_DEMAND, SCHEDULE_WINDOW, demoCopy, statusLabel } from '../config/demoMode'

const GRAFANA_URL =
  'https://grafana.creechlabs.dev/d/demo-pub/demo?orgId=2&kiosk&theme=dark'

export default function GrafanaPanel({ status }) {
  // No data (API unreachable) stays undefined -> grey dot, no label.
  const grafanaStatus = status?.apps?.detail?.grafana?.status
  const isUp = grafanaStatus === 'up'
  // EKS reports CREATING/UPDATING while a build runs; show progress rather
  // than inviting another demo request.
  const isBuilding = status?.eks?.status === 'provisioning'

  return (
    <div className="h-full flex flex-col bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
      {/* Context bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--color-border)] shrink-0 rounded-t-2xl overflow-visible">
        <i className="ti ti-chart-dots-3 text-sm text-[var(--color-accent)]" aria-hidden="true" />
        <p className="text-xs text-[var(--color-text-secondary)]">{demoCopy.panelBar}</p>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <StatusDot status={grafanaStatus} tooltip={false} />
          <span className="text-xs text-[var(--color-text-tertiary)]">
            {statusLabel(grafanaStatus)}
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
      ) : isBuilding ? (
        <div className="w-full flex-1 flex flex-col items-center justify-center gap-3 p-8 rounded-b-2xl">
          <i className="ti ti-loader-2 animate-spin text-3xl text-[var(--color-accent)]" aria-hidden="true" />
          <p className="text-sm text-[var(--color-text-secondary)] text-center max-w-sm leading-relaxed">
            {demoCopy.showcase.building}
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Cluster: {status?.eks?.detail?.clusterStatus ?? 'unknown'}
          </p>
        </div>
      ) : IS_ON_DEMAND ? (
        <div className="flex-1 min-h-0">
          <DemoShowcase />
        </div>
      ) : (
        <div className="w-full flex-1 flex flex-col items-center justify-center gap-3 p-8 rounded-b-2xl">
          <i className="ti ti-moon text-3xl text-[var(--color-text-tertiary)]" aria-hidden="true" />
          <p className="text-sm text-[var(--color-text-secondary)] text-center max-w-xs">
            Grafana is offline — the EKS cluster runs {SCHEDULE_WINDOW}. Check back during
            business hours.
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
