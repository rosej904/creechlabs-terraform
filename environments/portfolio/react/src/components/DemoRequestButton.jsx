import { useState } from 'react'
import DemoRequestModal from './DemoRequestModal'
import { demoCopy } from '../config/demoMode'

/**
 * Owns its own modal state, so it can be dropped anywhere without
 * threading callbacks through App. Two visual weights:
 *
 *   primary → filled accent, used in the showcase overlay
 *   subtle  → bordered, matches the existing strip buttons
 */
export default function DemoRequestButton({ variant = 'primary', className = '', label }) {
  const [open, setOpen] = useState(false)

  const base =
    'inline-flex items-center gap-2 text-sm rounded-xl transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]'

  const styles =
    variant === 'primary'
      ? 'bg-[var(--color-accent)] text-[#0b0d10] font-medium px-5 py-2.5 hover:opacity-90'
      : 'bg-[var(--color-bg)] border border-[var(--color-border)] px-4 py-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)]'

  return (
    <>
      <button onClick={() => setOpen(true)} className={`${base} ${styles} ${className}`}>
        <i
          className={`ti ti-player-play${variant === 'primary' ? '' : ' text-[var(--color-accent)]'} text-base`}
          aria-hidden="true"
        />
        {label ?? demoCopy.showcase.cta}
      </button>

      {open && <DemoRequestModal onClose={() => setOpen(false)} />}
    </>
  )
}
