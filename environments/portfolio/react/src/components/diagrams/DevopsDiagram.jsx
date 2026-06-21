export default function DevopsDiagram({ className = '' }) {
  return (
    <svg viewBox="0 0 680 500" className={className} role="img" aria-label="Git changes sync through ArgoCD, which manages ingress controllers that provision DNS resources">
      <defs>
        <marker id="devops-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>

      <rect x="30" y="30" width="260" height="64" rx="10" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="160" y="50" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">GitHub repository</text>
      <text x="160" y="70" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">App manifests / values</text>

      <path d="M160 94 L160 158" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#devops-arrow)" />
      <text x="175" y="128" fontSize="12" fill="var(--color-text-secondary)">git push trigger</text>

      <rect x="30" y="160" width="260" height="220" rx="14" fill="var(--color-accent-dim)" opacity="0.35" stroke="var(--color-accent)" strokeWidth="0.5" />
      <text x="50" y="182" fontSize="14" fill="var(--color-text-primary)">ArgoCD instance</text>

      <rect x="55" y="200" width="210" height="50" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="160" y="225" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">Root app of apps</text>

      <line x1="160" y1="250" x2="160" y2="278" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#devops-arrow)" />
      <text x="195" y="266" fontSize="12" fill="var(--color-text-secondary)">manages</text>

      <rect x="55" y="280" width="210" height="50" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="160" y="305" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">ArgoCD application</text>

      <text x="50" y="354" fontSize="12" fill="var(--color-text-secondary)">two sources: helm chart + git values</text>

      <line x1="290" y1="305" x2="418" y2="305" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#devops-arrow)" />
      <text x="354" y="295" textAnchor="middle" fontSize="12" fill="var(--color-text-secondary)">automated sync</text>

      <rect x="420" y="160" width="230" height="220" rx="14" fill="var(--color-accent-dim)" opacity="0.5" stroke="var(--color-accent)" strokeWidth="0.5" />
      <text x="440" y="182" fontSize="14" fill="var(--color-text-primary)">EKS cluster</text>

      <rect x="440" y="200" width="190" height="44" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="535" y="222" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">Ingress resource</text>

      <rect x="440" y="320" width="190" height="44" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="535" y="342" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">K8s service</text>

      <line x1="535" y1="244" x2="535" y2="318" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#devops-arrow)" />
      <text x="555" y="284" fontSize="12" fill="var(--color-text-secondary)">routes to</text>

      <rect x="440" y="260" width="85" height="44" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="482" y="282" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-primary)">ExternalDNS</text>

      <path d="M482 260 L482 122" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#devops-arrow)" />
      <text x="482" y="142" textAnchor="middle" fontSize="12" fill="var(--color-text-secondary)">watches + syncs</text>

      <rect x="420" y="20" width="230" height="100" rx="14" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="440" y="42" fontSize="14" fill="var(--color-text-primary)">Cloud infrastructure</text>

      <rect x="440" y="58" width="190" height="44" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="535" y="80" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-primary)">Cloudflare DNS records</text>

      <rect x="30" y="420" width="260" height="64" rx="10" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="160" y="440" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">Helm registry</text>
      <text x="160" y="460" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">Public charts</text>

      <path d="M160 380 L160 418" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#devops-arrow)" />
    </svg>
  )
}
