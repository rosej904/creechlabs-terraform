import DiagramImage from './diagrams/DiagramImage'

export default function DevopsDetail() {
  return (
    <div>
      <DiagramImage name="devops" variant="full" className="w-full mb-6" alt="DevOps and delivery architecture diagram" />

      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
        Placeholder elaboration — a push to the Terraform repo doesn't deploy
        anything directly. CodeBuild picks up scheduled applies on weekday
        mornings, and ArgoCD continuously reconciles the cluster against
        what's defined in Git using an app-of-apps pattern.
      </p>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
        Placeholder elaboration — notes on why GitOps over a push-based
        pipeline, and how the destroy/rebuild cycle interacts with ArgoCD's
        reconciliation loop.
      </p>

      <div className="border-t border-[var(--color-border)] pt-5">
        <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-3 uppercase tracking-wide">
          Stack
        </p>
        <div className="flex flex-wrap gap-2">
          {['GitHub', 'CodeBuild', 'EventBridge', 'ArgoCD', 'Helm'].map((tag) => (
            <span
              key={tag}
              className="text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-2.5 py-1 text-[var(--color-text-secondary)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
