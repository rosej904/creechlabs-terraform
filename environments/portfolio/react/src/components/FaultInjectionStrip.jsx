const FAULT_INJECTION_URL = 'https://otel-demo.creechlabs.dev/feature'

export default function FaultInjectionStrip({ status }) {
  const otelUp = status?.apps?.detail?.otel_demo?.status === 'up'

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-8 py-4 mb-4 flex flex-wrap items-center gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium mb-0.5">Try it — inject a fault</p>
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          Enable a failure flag then watch error rates climb and SLO burn
          alerts fire on the dashboard in real time.
        </p>
      </div>

      {otelUp ? (
        /*
         * TODO: replace this button with an iframe once otel-demo's CSP
         * header is updated to allow embedding from creechlabs.dev.
         *
         * The current response header is:
         *   Content-Security-Policy: frame-ancestors 'self'
         *
         * To fix: add frame-ancestors to the otel-demo ingress or Envoy
         * config so the header becomes:
         *   frame-ancestors 'self' https://creechlabs.dev
         *
         * Once that's deployed, replace this <a> with:
         *   <iframe
         *     title="OTel demo fault injection"
         *     src={FAULT_INJECTION_URL}
         *     className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]"
         *     style={{ width: '480px', height: '160px' }}
         *     loading="lazy"
         *   />
         */
        <a
          href={FAULT_INJECTION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)] transition-colors shrink-0"
        >
          <i className="ti ti-flag-3 text-[var(--color-accent)]" aria-hidden="true" />
          Open fault injection UI
          <i className="ti ti-external-link text-xs opacity-60" aria-hidden="true" />
        </a>
      ) : (
        <span className="text-xs text-[var(--color-text-tertiary)] shrink-0">
          {status ? 'Stack is offline — weekdays 8:30am–5:00pm ET' : 'Checking status…'}
        </span>
      )}
    </div>
  )
}
