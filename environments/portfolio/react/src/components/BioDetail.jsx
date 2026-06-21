export default function BioDetail() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-[var(--color-accent-dim)] flex items-center justify-center text-base font-medium text-[var(--color-accent)] shrink-0">
          JC
        </div>
        <div>
          <p className="font-medium text-base">Jordan Creech</p>
          <p className="text-sm text-[var(--color-text-secondary)]">Placeholder title — SRE</p>
        </div>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
        Placeholder bio paragraph — background, years of experience, and the
        kind of work done day to day. Replace with real career summary.
      </p>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
        Placeholder paragraph — what drew me to infrastructure and
        observability work, and what this project is meant to demonstrate
        to people reviewing it.
      </p>

      <div className="border-t border-[var(--color-border)] pt-5">
        <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-3 uppercase tracking-wide">
          Elsewhere
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href="#"
            className="text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-2.5 py-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] inline-flex items-center gap-1"
          >
            <i className="ti ti-brand-github" aria-hidden="true" /> GitHub
          </a>
          <a
            href="#"
            className="text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-2.5 py-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] inline-flex items-center gap-1"
          >
            <i className="ti ti-brand-linkedin" aria-hidden="true" /> LinkedIn
          </a>
          <a
            href="#"
            className="text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-2.5 py-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] inline-flex items-center gap-1"
          >
            <i className="ti ti-mail" aria-hidden="true" /> Email
          </a>
        </div>
      </div>
    </div>
  )
}