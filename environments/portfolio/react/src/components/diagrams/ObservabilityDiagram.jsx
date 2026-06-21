export default function ObservabilityDiagram({ className = '' }) {
  return (
    <svg viewBox="0 0 680 520" className={className} role="img" aria-label="Application pods and worker nodes send telemetry to a collection tier which writes to Loki, Tempo, and Prometheus, all queried by Grafana">
      <defs>
        <marker id="obs-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>

      <rect x="30" y="20" width="280" height="80" rx="14" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="50" y="42" fontSize="14" fill="var(--color-text-primary)">Application pods</text>
      <rect x="50" y="58" width="240" height="34" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="170" y="75" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">Apps with OTel SDKs</text>

      <rect x="30" y="120" width="280" height="200" rx="14" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="50" y="142" fontSize="14" fill="var(--color-text-primary)">Worker Nodes</text>

      <rect x="50" y="158" width="240" height="34" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="170" y="175" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">FluentBit (DaemonSet)</text>

      <rect x="50" y="246" width="240" height="34" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="170" y="263" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">Prometheus Node Exporter (DaemonSet)</text>

      <rect x="50" y="202" width="240" height="34" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="170" y="219" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">Kubelet</text>

      <rect x="50" y="290" width="240" height="20" rx="6" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="170" y="300" textAnchor="middle" dominantBaseline="central" fontSize="11" fill="var(--color-text-tertiary)">Control plane: kube-api-server</text>

      <rect x="390" y="92" width="180" height="120" rx="12" fill="var(--color-accent-dim)" opacity="0.45" stroke="var(--color-accent)" strokeWidth="0.5" />
      <text x="480" y="116" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">OTel collector</text>
      <text x="480" y="138" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">receives OTLP</text>
      <text x="480" y="158" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">scrapes metrics</text>
      <text x="480" y="178" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">pushes logs + traces</text>

      <path d="M310 75 L350 75 L350 142 L388 142" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#obs-arrow)" />
      <path d="M310 175 L350 175 L350 162 L388 162" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#obs-arrow)" />
      <path d="M310 263 L350 263 L350 182 L388 182" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#obs-arrow)" />

      <rect x="430" y="260" width="170" height="50" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="515" y="280" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">Loki</text>
      <text x="515" y="298" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">logs</text>

      <rect x="430" y="330" width="170" height="50" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="515" y="350" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">Tempo</text>
      <text x="515" y="368" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">traces</text>

      <rect x="430" y="400" width="170" height="50" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="515" y="420" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">Prometheus</text>
      <text x="515" y="438" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">metrics</text>

      <path d="M480 212 L480 230 L515 230 L515 258" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#obs-arrow)" />
      <text x="525" y="240" fontSize="12" fill="var(--color-text-secondary)">push</text>

      <path d="M500 212 L545 212 L545 290 L600 290 L600 328 L515 328" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#obs-arrow)" />
      <text x="555" y="285" fontSize="12" fill="var(--color-text-secondary)">push</text>

      <path d="M460 212 L420 212 L420 400 L428 400" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#obs-arrow)" />
      <text x="370" y="395" fontSize="12" fill="var(--color-text-secondary)">scrape</text>

      <rect x="60" y="380" width="290" height="60" rx="12" fill="var(--color-accent-dim)" opacity="0.35" stroke="var(--color-accent)" strokeWidth="0.5" />
      <text x="205" y="405" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">Grafana dashboard</text>
      <text x="205" y="425" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">queries all three backends</text>

      <path d="M350 398 L428 285" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#obs-arrow)" />
      <path d="M350 410 L428 355" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#obs-arrow)" />
      <path d="M350 422 L428 422" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#obs-arrow)" />
      <text x="205" y="360" textAnchor="middle" fontSize="12" fill="var(--color-text-secondary)">query</text>
    </svg>
  )
}
