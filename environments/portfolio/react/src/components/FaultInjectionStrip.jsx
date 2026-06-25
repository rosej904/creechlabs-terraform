const FAULT_INJECTION_URL = 'https://otel-demo.creechlabs.dev/feature'
const OTEL_DEMO_URL = 'https://otel-demo.creechlabs.dev'

export default function FaultInjectionStrip({ status }) {
  const otelUp = status?.apps?.detail?.otel_demo?.status === 'up'

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 md:px-8 py-3 md:py-4 mb-4 flex flex-wrap items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium mb-0.5">Try it out — </p>
        <p className="hidden md:block text-xs text-[var(--color-text-secondary)] leading-relaxed">
          Inject a fault to trigger real-time SLO burn alerts & alerts, or explore the OTel Demo UI to track logs and traces directly.
        </p>
      </div>

      {otelUp ? (
        <>

        <a
          href={FAULT_INJECTION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)] transition-colors shrink-0"
        >
          <i className="ti ti-flag-3 text-[var(--color-accent)]" aria-hidden="true" />
          Inject a fault
          <i className="ti ti-external-link text-xs opacity-60" aria-hidden="true" />
        </a>
        <a
          href={OTEL_DEMO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)] transition-colors shrink-0"
        >
          <i className="ti ti-flag-3 text-[var(--color-accent)]" aria-hidden="true" />
          Explore OTel Demo UI
          <i className="ti ti-external-link text-xs opacity-60" aria-hidden="true" />
        </a>
        </>
      ) : (
        <span className="text-xs text-[var(--color-text-tertiary)] shrink-0">
          {status ? 'Stack is offline — weekdays 8:30am–5:00pm ET' : 'Checking status…'}
        </span>
      )}
    </div>
  )
}
