export default function Footer() {
  return (
    <footer className="mt-4 pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-xs text-[var(--color-text-tertiary)]">
        Jordan Creech Rose
      </p>
      <div className="flex items-center gap-4">
        <a
          href="https://www.linkedin.com/in/jordan-c-rose/" target="_blank" rel="noopener noreferrer"
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          aria-label="LinkedIn"
        >
          <i className="ti ti-brand-linkedin text-lg" aria-hidden="true" />
        </a>
        <a
          href="https://github.com/rosej904/creechlabs-terraform" target="_blank" rel="noopener noreferrer"
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          aria-label="GitHub"
        >
          <i className="ti ti-brand-github text-lg" aria-hidden="true" />
        </a>
        <a
          href="mailto:jordan_rose@creechlabs.dev"
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          aria-label="Email"
        >
          <i className="ti ti-mail text-lg" aria-hidden="true" />
        </a>
      </div>
    </footer>
  )
}
