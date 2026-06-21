export default function ObservabilityTeaser({ className = '' }) {
  return (
    <svg viewBox="0 0 680 260" className={className} role="img" aria-label="Collector pushing telemetry into three backends, visualized by Grafana">
      <defs>
        <marker id="obs-teaser-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>

      <rect x="250" y="20" width="180" height="44" rx="8" fill="var(--color-accent-dim)" opacity="0.5" stroke="var(--color-accent)" strokeWidth="0.5" />
      <text x="340" y="42" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">Collector</text>

      <path d="M300 64 L300 90 L150 90 L150 106" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#obs-teaser-arrow)" />
      <path d="M340 64 L340 106" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#obs-teaser-arrow)" />
      <path d="M380 64 L380 90 L530 90 L530 106" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#obs-teaser-arrow)" />

      <rect x="80" y="108" width="140" height="42" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="150" y="129" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">Metrics</text>

      <rect x="270" y="108" width="140" height="42" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="340" y="129" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">Logs</text>

      <rect x="460" y="108" width="140" height="42" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="530" y="129" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">Traces</text>

      <path d="M150 150 L150 180 L340 180 L340 188" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="0.5" />
      <path d="M530 150 L530 180 L340 180" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#obs-teaser-arrow)" />
      <path d="M340 150 L340 188" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="0.5" />

      <rect x="250" y="190" width="180" height="40" rx="8" fill="var(--color-accent-dim)" opacity="0.5" stroke="var(--color-accent)" strokeWidth="0.5" />
      <text x="340" y="210" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">Grafana</text>
    </svg>
  )
}
