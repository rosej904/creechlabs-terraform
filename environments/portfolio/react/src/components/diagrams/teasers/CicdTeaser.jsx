export default function CicdTeaser({ className = '' }) {
  return (
    <svg viewBox="0 0 680 200" className={className} role="img" aria-label="Apply and destroy schedules feeding the ephemeral cluster">
      <defs>
        <marker id="cicd-teaser-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>

      <rect x="60" y="20" width="240" height="50" rx="8" fill="var(--color-accent-dim)" opacity="0.5" stroke="var(--color-accent)" strokeWidth="0.5" />
      <text x="180" y="45" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">8:30am — apply</text>

      <rect x="380" y="20" width="240" height="50" rx="8" fill="var(--color-accent-dim)" opacity="0.5" stroke="var(--color-accent)" strokeWidth="0.5" />
      <text x="500" y="45" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">5:00pm — destroy</text>

      <path d="M180 70 L180 110 L340 110" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="0.5" />
      <path d="M500 70 L500 110 L340 110" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#cicd-teaser-arrow)" />
      <line x1="180" y1="110" x2="280" y2="110" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#cicd-teaser-arrow)" />

      <rect x="190" y="112" width="300" height="50" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="340" y="137" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">EKS — ephemeral</text>
    </svg>
  )
}
