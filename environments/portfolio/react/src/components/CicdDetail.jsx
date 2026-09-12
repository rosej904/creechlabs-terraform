import DiagramImage from './diagrams/DiagramImage'
import DemoRequestButton from './DemoRequestButton'
import { IS_ON_DEMAND, demoCopy } from '../config/demoMode'

export default function CicdDetail() {
  return (
    <div>
      <DiagramImage
        name="cicd"
        variant="full"
        className="w-full mb-6"
        alt="Apply and destroy cycle diagram"
      />

      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
        {demoCopy.cicdBody}
      </p>

      <div className="border-t border-[var(--color-border)] pt-5">
        <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-3 uppercase tracking-wide">
          Persisted vs ephemeral
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-3">
            <span className="text-sm font-medium">{demoCopy.cicdPersistedRow}</span>
            <span className="text-xs text-[var(--color-text-secondary)] shrink-0">Always on</span>
          </div>
          <div className="flex items-center justify-between gap-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-3">
            <span className="text-sm font-medium">networking, eks, eks-infra, argocd</span>
            <span className="text-xs text-[var(--color-text-secondary)] shrink-0">
              {demoCopy.cicdEphemeralLabel}
            </span>
          </div>
        </div>
      </div>

      {IS_ON_DEMAND && (
        <div className="border-t border-[var(--color-border)] mt-5 pt-5 flex flex-wrap items-center gap-3">
          <p className="flex-1 min-w-0 text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Want to watch a build happen? Request a demo and I will trigger the pipeline.
          </p>
          <DemoRequestButton variant="subtle" />
        </div>
      )}
    </div>
  )
}
