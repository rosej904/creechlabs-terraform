import DiagramImage from './diagrams/DiagramImage'

const GRAFANA_URL =
  'https://grafana.creechlabs.dev/d/demo-pub/demo?orgId=6&kiosk&theme=dark'

const FAULT_INJECTION_URL = 'https://otel-demo.creechlabs.dev/feature'

export default function ObservabilityDetail({ status }) {
  const grafanaStatus = status?.apps?.detail?.grafana?.status
  const otelStatus = status?.apps?.detail?.otel_demo?.status
  const isUp = grafanaStatus === 'up'
  const otelUp = otelStatus === 'up'

  return (
    <div>
      <DiagramImage name="observability" variant="full" className="w-full mb-6" alt="Observability architecture diagram" />

      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
        Prometheus, Loki, and Tempo feed Grafana with
        cross-datasource correlation — click a trace to jump straight to it's
        logs, or from a log line back to the trace that produced it. The
        otel-demo app generates and ships live telemetry via OTLP to the otel-collector which export to the respective backends. 
        Fluentbit scrapes container logs and ships direct to Loki. Observability|SRE|Monitoring-as-Service is implemented via an opt-in model. The services - checkout,
        recommendation, frontend, and product catalog have enabled SRE monitoring via adding a label to the deployment. This enables 
        SLO burn-rate and error budgets. 
      </p>

      <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-4 mb-6">
        <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-2 uppercase tracking-wide">
          Notes on Live Grafana Dashboard Demo
        </p>
        <ul className="space-y-1">
          {[
            'SLO burn windows are compressed for demo purposes (5m/1h fast burn, 30m/3h slow burn) — production pattern uses 28–30 day windows',
            'Stack is ephemeral — destroyed nightly at 5pm ET, rebuilt 9am ET weekdays; dashboard shows "No data" outside those hours',
            'Log–trace correlation only available for OTLP-instrumented services; other services log without trace context',
          ].map((note) => (
            <li key={note} className="flex gap-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
              <i className="ti ti-info-circle shrink-0 mt-0.5 text-[var(--color-text-tertiary)]" aria-hidden="true" />
              {note}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-[var(--color-border)] pt-5">
        <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-3 uppercase tracking-wide">
          Stack
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            'Prometheus',
            'Loki',
            'Tempo',
            'Grafana',
            'OTel collector',
            'Fluent Bit',
            'otel-demo',
            'SRE Practices/Concepts',
          ].map((tag) => (
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
