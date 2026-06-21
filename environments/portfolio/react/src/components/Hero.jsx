export default function Hero({ onBioClick }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl mb-4 grid grid-cols-1 md:grid-cols-[1.4fr_1fr]">
      <div className="p-8 flex flex-col justify-center">
        <p className="text-sm text-[var(--color-text-tertiary)] mb-2">Hi, I'm</p>
        <h1 className="text-3xl font-medium mb-3">Jordan Creech</h1>
        <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6 max-w-lg">
          Placeholder intro — SRE / infrastructure engineer focused on
          observability, Kubernetes, and infrastructure as code. This site is
          itself a running demo of the infrastructure it describes.
        </p>
        <div className="flex flex-wrap gap-2">
          {['Terraform', 'AWS EKS', 'ArgoCD', 'Observability'].map((tag) => (
            <span
              key={tag}
              className="text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-2.5 py-1 text-[var(--color-text-secondary)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="relative flex items-center">
        <div
          className="hidden md:block absolute left-0 top-1/4 bottom-1/4 w-px bg-[var(--color-border)]"
          aria-hidden="true"
        />
        <button
          onClick={onBioClick}
          className="text-left p-8 flex flex-col justify-center hover:bg-[var(--color-surface-hover)] transition-colors w-full h-full rounded-b-2xl md:rounded-b-none md:rounded-r-2xl"
        >
          <div className="w-11 h-11 rounded-full bg-[var(--color-accent-dim)] flex items-center justify-center text-sm font-medium text-[var(--color-accent)] mb-4">
            JC
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Placeholder bio — a few sentences about background, current role,
            and what this project is meant to demonstrate.
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-4 flex items-center gap-1">
            More about me <i className="ti ti-chevron-right" aria-hidden="true" />
          </p>
        </button>
      </div>
    </div>
  )
}
