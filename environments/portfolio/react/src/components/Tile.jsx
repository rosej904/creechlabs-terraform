export default function Tile({ icon, title, diagram, onClick, statusSlot, dimmed = false }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`text-left bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 transition-colors aspect-square flex flex-col
        ${onClick ? 'hover:bg-[var(--color-surface-hover)] cursor-pointer' : 'cursor-default'}
        ${dimmed ? 'opacity-60' : ''}`}
    >
      {diagram ? (
        <div className="flex-1 flex items-center justify-center min-h-0 mb-3">
          <div className="w-full">{diagram}</div>
        </div>
      ) : (
        <div className="flex-1 flex items-center mb-3">
          <i className={`ti ${icon} text-2xl text-[var(--color-accent)]`} aria-hidden="true" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">{title}</p>
        {statusSlot}
      </div>
    </button>
  )
}
