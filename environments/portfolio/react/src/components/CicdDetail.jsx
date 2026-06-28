import DiagramImage from './diagrams/DiagramImage'

export default function CicdDetail() {
  return (
    <div>
      <DiagramImage name="cicd" variant="full" className="w-full mb-6" alt="Daily apply and destroy cycle diagram" />

      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
        the EKS cluster and everything it hosts is
        fully destroyed every evening and rebuilt every weekday morning,
        scheduled with EventBridge and run through CodeBuild. This isn't a
        scale-down; the cluster and its workloads are fully ephemeral and cease to exist entirely
        between 5pm and 9am ET.
      </p>
      <div className="border-t border-[var(--color-border)] pt-5">
        <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-3 uppercase tracking-wide">
          Persisted vs ephemeral
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-3">
            <span className="text-sm font-medium">dns-tls, cicd (codebuild projects and event bridge schedules), bootstrap (S3)</span>
            <span className="text-xs text-[var(--color-text-secondary)]">Always on</span>
          </div>
          <div className="flex items-center justify-between bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-3">
            <span className="text-sm font-medium">networking, eks, eks-infra, argocd</span>
            <span className="text-xs text-[var(--color-text-secondary)]">Rebuilt daily</span>
          </div>
        </div>
      </div>
    </div>
  )
}
