export default function ListTile({ title, blurb, diagram, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 hover:bg-[var(--color-surface-hover)] transition-colors flex items-center gap-4"
    >
      {diagram && (
        <div className="w-24 shrink-0 opacity-80">
          {diagram}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm mb-1">{title}</p>
        {blurb && (
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {blurb}
          </p>
        )}
        <p className="text-xs text-[var(--color-text-tertiary)] mt-2 flex items-center gap-1">
          View details
          <i className="ti ti-chevron-right text-xs" aria-hidden="true" />
        </p>
      </div>
    </button>
  )
}
