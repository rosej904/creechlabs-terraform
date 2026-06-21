import DiagramImage from './diagrams/DiagramImage'

export default function ObservabilityDetail({ status }) {
  const grafanaStatus = status?.apps?.detail?.grafana?.status
  const isUp = grafanaStatus === 'up'

  return (
    <div>
      <DiagramImage name="observability" variant="full" className="w-full mb-6" alt="Observability architecture diagram" />

      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
        Prometheus, Loki, and Tempo feed a shared Grafana instance with
        cross-datasource correlation — jump from a trace straight to its
        logs, or from a log line to the trace that produced it.
      </p>

      {isUp ? (
        <div className="rounded-lg overflow-hidden border border-[var(--color-border)]">
          <iframe
            title="Grafana dashboard"
            src="https://grafana.creechlabs.dev/d-solo/placeholder-uid/overview?orgId=1&kiosk&theme=dark"
            className="w-full h-[480px] bg-[var(--color-bg)]"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-8 text-center">
          <i
            className="ti ti-moon text-2xl text-[var(--color-text-tertiary)] mb-3 block"
            aria-hidden="true"
          />
          <p className="text-sm text-[var(--color-text-secondary)]">
            Grafana is offline right now — the EKS cluster is on its nightly
            schedule (down 5pm–8:30am ET, weekdays). Check back during
            business hours to explore it live.
          </p>
        </div>
      )}

      <div className="border-t border-[var(--color-border)] pt-5 mt-6">
        <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-3 uppercase tracking-wide">
          Datasources
        </p>
        <div className="flex flex-wrap gap-2">
          {['Prometheus (metrics)', 'Loki (logs)', 'Tempo (traces)'].map((tag) => (
            <span
              key={tag}
              className="text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-2.5 py-1 text-[var(--color-text-secondary)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
