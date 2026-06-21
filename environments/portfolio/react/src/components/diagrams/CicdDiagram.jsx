export default function CicdDiagram({ className = '' }) {
  return (
    <svg viewBox="0 0 680 460" className={className} role="img" aria-label="EventBridge schedules trigger CodeBuild projects that run Terraform apply each morning and destroy each evening">
      <defs>
        <marker id="cicd-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M2 1L8 5L2 9" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </marker>
      </defs>

      <rect x="40" y="30" width="280" height="64" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="180" y="54" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">EventBridge — 8:30am ET weekdays</text>
      <text x="180" y="74" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">Triggers apply build</text>

      <rect x="360" y="30" width="280" height="64" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="500" y="54" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">EventBridge — 5:00pm ET weekdays</text>
      <text x="500" y="74" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">Triggers destroy build</text>

      <line x1="180" y1="94" x2="180" y2="132" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#cicd-arrow)" />
      <line x1="500" y1="94" x2="500" y2="132" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#cicd-arrow)" />

      <rect x="40" y="134" width="280" height="64" rx="8" fill="var(--color-accent-dim)" opacity="0.35" stroke="var(--color-accent)" strokeWidth="0.5" />
      <text x="180" y="158" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">CodeBuild — apply project</text>
      <text x="180" y="178" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">Secrets Manager → TF_VAR_*</text>

      <rect x="360" y="134" width="280" height="64" rx="8" fill="var(--color-accent-dim)" opacity="0.35" stroke="var(--color-accent)" strokeWidth="0.5" />
      <text x="500" y="158" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">CodeBuild — destroy project</text>
      <text x="500" y="178" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">Deletes LoadBalancer services first</text>

      <line x1="180" y1="198" x2="180" y2="236" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#cicd-arrow)" />
      <line x1="500" y1="198" x2="500" y2="236" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#cicd-arrow)" />

      <rect x="40" y="238" width="280" height="64" rx="8" fill="var(--color-accent-dim)" opacity="0.6" stroke="var(--color-accent)" strokeWidth="0.5" />
      <text x="180" y="262" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">terraform apply</text>
      <text x="180" y="282" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">networking → eks → eks-infra → argocd</text>

      <rect x="360" y="238" width="280" height="64" rx="8" fill="var(--color-accent-dim)" opacity="0.6" stroke="var(--color-accent)" strokeWidth="0.5" />
      <text x="500" y="262" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">terraform destroy</text>
      <text x="500" y="282" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">argocd → eks-infra → eks → networking</text>

      <path d="M180 302 L180 340 L340 340" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="0.5" />
      <path d="M500 302 L500 340 L340 340" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#cicd-arrow)" />
      <line x1="180" y1="340" x2="280" y2="340" stroke="var(--color-text-tertiary)" strokeWidth="0.5" markerEnd="url(#cicd-arrow)" />

      <rect x="190" y="342" width="300" height="50" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="340" y="362" textAnchor="middle" dominantBaseline="central" fontSize="14" fill="var(--color-text-primary)">EKS cluster — ephemeral</text>
      <text x="340" y="380" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">exists 8:30am – 5:00pm ET weekdays</text>

      <rect x="40" y="410" width="600" height="40" rx="8" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="0.5" />
      <text x="340" y="430" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="var(--color-text-secondary)">Persisted always: dns-tls, cicd, bootstrap layers — never in the destroy buildspec</text>
    </svg>
  )
}
