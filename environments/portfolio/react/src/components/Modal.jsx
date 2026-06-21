import { useEffect, useState } from 'react'

export default function Modal({ title, onClose, children }) {
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

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 md:p-8 overflow-y-auto transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-5xl my-8 flex flex-col max-h-[calc(100vh-4rem)] transition-all duration-200 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] shrink-0">
          <h2 className="text-lg font-medium">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1"
          >
            <i className="ti ti-x text-xl" aria-hidden="true" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
