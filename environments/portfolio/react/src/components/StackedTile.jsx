export default function StackedTile({ onNotesClick, onRoadmapClick }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl aspect-square flex flex-col overflow-hidden">
      <button
        onClick={onNotesClick}
        className="flex-1 text-left p-5 flex flex-col justify-center hover:bg-[var(--color-surface-hover)] transition-colors border-b border-[var(--color-border)]"
      >
        <i className="ti ti-notes text-xl text-[var(--color-accent)] mb-2" aria-hidden="true" />
        <p className="font-medium text-sm">Notes on observability</p>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Short write-ups</p>
      </button>

      <button
        onClick={onRoadmapClick}
        className="flex-1 text-left p-5 flex flex-col justify-center hover:bg-[var(--color-surface-hover)] transition-colors"
      >
        <i className="ti ti-rocket text-xl text-[var(--color-accent)] mb-2" aria-hidden="true" />
        <p className="font-medium text-sm">More coming soon</p>
        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">What's next</p>
      </button>
    </div>
  )
}
