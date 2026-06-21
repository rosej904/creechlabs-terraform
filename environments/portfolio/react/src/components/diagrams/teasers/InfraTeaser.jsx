export default function InfraTeaser({ className = '' }) {
  return (
    <svg viewBox="0 0 680 240" className={className} role="img" aria-label="Four infrastructure layers stacked: networking, EKS, DevOps, DNS/TLS">
      <rect x="190" y="20" width="300" height="40" rx="8" fill="var(--color-accent-dim)" opacity="0.5" stroke="var(--color-accent)" strokeWidth="0.5" />
      <text x="340" y="40" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">Networking</text>

      <rect x="190" y="72" width="300" height="40" rx="8" fill="var(--color-accent-dim)" opacity="0.5" stroke="var(--color-accent)" strokeWidth="0.5" />
      <text x="340" y="92" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">EKS</text>

      <rect x="190" y="124" width="300" height="40" rx="8" fill="var(--color-accent-dim)" opacity="0.5" stroke="var(--color-accent)" strokeWidth="0.5" />
      <text x="340" y="144" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">DevOps</text>

      <rect x="190" y="176" width="300" height="40" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="340" y="196" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">DNS / TLS</text>
    </svg>
  )
}
