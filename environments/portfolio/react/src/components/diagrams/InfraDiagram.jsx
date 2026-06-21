export default function InfraDiagram({ className = '' }) {
  return (
    <svg viewBox="0 0 680 760" className={className} role="img" aria-label="Terraform provisions networking, EKS, platform add-ons, and DNS/TLS layers in sequence inside AWS">
      <defs>
        <marker id="infra-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>

      <rect x="40" y="20" width="600" height="44" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="340" y="42" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">Terraform — layered apply, 1 → 4</text>
      <line x1="340" y1="64" x2="340" y2="92" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#infra-arrow)" />

      <rect x="40" y="94" width="600" height="150" rx="14" fill="var(--color-accent-dim)" opacity="0.25" stroke="var(--color-accent)" strokeWidth="0.5" />
      <text x="60" y="116" fontSize="14" fill="var(--color-text-primary)">1 · Networking layer</text>

      <rect x="60" y="134" width="560" height="96" rx="10" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="0.5" />
      <text x="76" y="150" fontSize="12" fill="var(--color-text-secondary)">Virtual Private Cloud (VPC)</text>

      <rect x="76" y="160" width="260" height="56" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="206" y="180" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">Public subnets</text>
      <text x="206" y="200" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">Routes, NAT, IGW</text>

      <rect x="350" y="160" width="260" height="56" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="480" y="180" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">Private subnets</text>
      <text x="480" y="200" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">Routes</text>

      <line x1="340" y1="244" x2="340" y2="272" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#infra-arrow)" />

      <rect x="40" y="274" width="600" height="220" rx="14" fill="var(--color-accent-dim)" opacity="0.4" stroke="var(--color-accent)" strokeWidth="0.5" />
      <text x="60" y="296" fontSize="14" fill="var(--color-text-primary)">2 · EKS layer</text>

      <rect x="60" y="314" width="270" height="56" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="195" y="334" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">CoreDNS, kube-proxy</text>
      <text x="195" y="354" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">vpc-cni, ebs-csi</text>

      <rect x="350" y="314" width="270" height="56" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="485" y="334" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">EC2 autoscaling group</text>
      <text x="485" y="354" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">3x t3.medium nodes</text>

      <rect x="60" y="382" width="270" height="56" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="195" y="402" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">IAM roles and policies</text>
      <text x="195" y="422" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">Service accounts, OIDC</text>

      <rect x="350" y="382" width="270" height="56" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="485" y="402" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">Storage class</text>
      <text x="485" y="422" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">Cluster autoscaler</text>

      <line x1="340" y1="494" x2="340" y2="522" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#infra-arrow)" />

      <rect x="40" y="524" width="600" height="100" rx="14" fill="var(--color-accent-dim)" opacity="0.7" stroke="var(--color-accent)" strokeWidth="0.5" />
      <text x="60" y="546" fontSize="14" fill="var(--color-text-primary)">3 · DevOps layer</text>

      <rect x="60" y="564" width="180" height="42" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="150" y="585" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">ArgoCD</text>

      <rect x="250" y="564" width="180" height="42" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="340" y="585" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">external-dns</text>

      <rect x="440" y="564" width="180" height="42" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="530" y="585" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">aws-lbc</text>

      <line x1="340" y1="624" x2="340" y2="652" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#infra-arrow)" />

      <rect x="40" y="654" width="600" height="84" rx="14" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="60" y="676" fontSize="14" fill="var(--color-text-primary)">4 · DNS / TLS layer — never destroyed</text>

      <rect x="60" y="692" width="270" height="36" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="195" y="710" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">ACM wildcard cert</text>

      <rect x="350" y="692" width="270" height="36" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="485" y="710" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">Cloudflare DNS records</text>
    </svg>
  )
}
