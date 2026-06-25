// Drop your profile image into public/images/profile.jpg (or .png/.webp).
// If the file doesn't exist the initials fallback shows automatically.
const PROFILE_IMAGE = '/images/profile.jpg'
const INITIALS = 'JR'

function Avatar() {
  return (
    <div className="relative w-14 h-14 mb-4">
      <img
        src={PROFILE_IMAGE}
        alt="Jordan Creech Rose"
        className="w-14 h-14 rounded-full object-cover"
        onError={(e) => {
          // Image missing → hide img, show initials fallback
          e.currentTarget.style.display = 'none'
          e.currentTarget.nextElementSibling.style.display = 'flex'
        }}
      />
      {/* Initials fallback — hidden by default, shown if image fails to load */}
      <div
        className="w-14 h-14 rounded-full bg-[var(--color-accent-dim)] items-center justify-center text-base font-medium text-[var(--color-accent)] absolute inset-0"
        style={{ display: 'none' }}
        aria-hidden="true"
      >
        {INITIALS}
      </div>
    </div>
  )
}

export default function Hero({ onBioClick }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl mb-4 grid grid-cols-1 md:grid-cols-[1.4fr_1fr]">
      <div className="p-5 md:p-8 flex flex-col justify-center">
        <p className="text-xs md:text-sm text-[var(--color-text-tertiary)] mb-1 md:mb-2">Hi, I'm</p>
        <h1 className="text-2xl md:text-3xl font-medium mb-2 md:mb-3">Jordan Rose</h1>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4 md:mb-6 max-w-3xl hidden md:block">
          Welcome to my semi-production grade playground, evolved from a personal
          testing environment. This is an ephemeral, declarative, automated environment
          that is destroyed and rebuilt every day. Driven 100% by EaC/IaC, this platform
          orchestrates AWS EKS, an advanced observability stack, and GitOps workflows
          via ArgoCD.
        </p>
        {/* Shorter version for mobile */}
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4 md:hidden">
          Ephemeral, declarative infrastructure — EKS, GitOps via ArgoCD, and a full observability stack. Rebuilt every day.
        </p>
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {['Terraform', 'Helm', 'ArgoCD', 'AWS EKS', 'OTel', 'Grafana/Loki/Tempo'].map((tag) => (
            <span
              key={tag}
              className="text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-2 py-0.5 md:px-2.5 md:py-1 text-[var(--color-text-secondary)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Bio panel — hidden on mobile to keep hero compact */}
      <div className="relative hidden md:flex items-center">
        <div
          className="absolute left-0 top-1/4 bottom-1/4 w-px bg-[var(--color-border)]"
          aria-hidden="true"
        />
        <button
          onClick={onBioClick}
          className="text-left p-8 flex flex-col justify-center hover:bg-[var(--color-surface-hover)] transition-colors w-full h-full md:rounded-r-2xl"
        >
          <Avatar />
          <p className="text-sm text-[var(--color-text-secondary)] mb-4 leading-relaxed">
            I am your resident infrastructure and observability expert. I like
            diving deep into solutioning and architecture and have developed a
            real passion for observability.
          </p>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {['AWS Certified Solutions Architect', 'CKA', 'OTel'].map((tag) => (
              <span
                key={tag}
                className="text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-2.5 py-1 text-[var(--color-text-secondary)]"
              >
                {tag}
              </span>
            ))}
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-4 flex items-center gap-1">
            More about me <i className="ti ti-chevron-right" aria-hidden="true" />
          </p>
        </button>
      </div>
    </div>
  )
}
