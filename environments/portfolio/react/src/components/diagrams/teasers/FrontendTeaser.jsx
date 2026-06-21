export default function FrontendTeaser({ className = '' }) {
  return (
    <svg viewBox="0 0 680 240" className={className} role="img" aria-label="Git, ArgoCD, and cluster as three stacked stages">
      <defs>
        <marker id="devops-teaser-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>

      <rect x="190" y="20" width="300" height="50" rx="8" fill="var(--color-accent-dim)" opacity="0.5" stroke="var(--color-accent)" strokeWidth="0.5" />
      <text x="340" y="45" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">Git</text>

      <line x1="340" y1="70" x2="340" y2="92" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#devops-teaser-arrow)" />

      <rect x="190" y="94" width="300" height="50" rx="8" fill="var(--color-accent-dim)" opacity="0.5" stroke="var(--color-accent)" strokeWidth="0.5" />
      <text x="340" y="119" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">ArgoCD</text>

      <line x1="340" y1="144" x2="340" y2="166" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#devops-teaser-arrow)" />

      <rect x="190" y="168" width="300" height="50" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="340" y="193" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">Cluster</text>
    </svg>
  )
}
