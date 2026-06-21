const ROADMAP_ITEMS = [
  {
    title: 'Shared deployment IAM role',
    detail: 'cl-portfolio-deployer — one assumable role for CodeBuild and local dev, replacing separate per-principal EKS access entries.',
  },
  {
    title: 'ArgoCD ApplicationSet',
    detail: 'Replace hardcoded branch references in child application.yaml files so target revision is inherited from the root app.',
  },
  {
    title: 'GitHub Actions deploy pipeline',
    detail: 'Keyless OIDC-based deploy for this frontend, replacing the manual aws s3 sync workflow.',
  },
  {
    title: 'otel-demo destroy fix',
    detail: 'Explicitly delete LoadBalancer-type services before networking teardown to avoid orphaned ALBs.',
  },
]

export default function RoadmapDetail() {
  return (
    <div>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
        Placeholder roadmap — things queued up for this project, roughly in
        the order I plan to get to them.
      </p>

      <div className="space-y-3">
        {ROADMAP_ITEMS.map((item) => (
          <div
            key={item.title}
            className="flex gap-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-3"
          >
            <i
              className="ti ti-circle-dashed text-lg text-[var(--color-text-tertiary)] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium mb-1">{item.title}</p>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {item.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}