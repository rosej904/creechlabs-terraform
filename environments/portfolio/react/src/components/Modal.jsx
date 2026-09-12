import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ title, onClose, children, wide = false }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  // Rendered through a portal to document.body. `position: fixed` is resolved
  // against the nearest ancestor that establishes a containing block, and
  // backdrop-filter (as well as filter, transform, perspective and
  // will-change) creates one. The DemoShowcase CTA card uses backdrop-blur,
  // so a modal opened from inside it was being sized and clipped to that
  // card instead of the viewport. The portal makes the modal a child of
  // body, where inset-0 means the viewport again.
  //
  // z-index sits above AnriWidget (9998 backdrop / 9999 panel) so a form
  // opened from inside the Anri modal still layers on top of it — nesting
  // used to give that for free via the DOM tree.
  return createPortal(
    <div
      className={`fixed inset-0 z-[10000] flex items-start justify-center bg-black/60 p-4 md:p-8 overflow-y-auto transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full ${wide ? 'max-w-[95vw]' : 'max-w-5xl'} my-8 flex flex-col max-h-[calc(100vh-4rem)] transition-all duration-200 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] shrink-0">
          <h2 className="text-lg font-medium">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)] transition-colors shrink-0"
          >
            <i className="ti ti-x text-base" aria-hidden="true" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  )
}
