export default function StackedTile({ onNotesClick, onRoadmapClick, onBioClick }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden flex flex-col">
      {/* About me — only visible on mobile where the hero bio panel is hidden */}
      {onBioClick && (
        <button
          onClick={onBioClick}
          className="md:hidden text-left p-4 flex items-center gap-3 hover:bg-[var(--color-surface-hover)] transition-colors border-b border-[var(--color-border)]"
        >
          <i className="ti ti-user text-lg text-[var(--color-accent)] shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">About me</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Background and certifications</p>
          </div>
          <i className="ti ti-chevron-right text-xs text-[var(--color-text-tertiary)]" aria-hidden="true" />
        </button>
      )}

      <button
        onClick={onNotesClick}
        className="text-left p-4 flex items-center gap-3 hover:bg-[var(--color-surface-hover)] transition-colors border-b border-[var(--color-border)]"
      >
        <i className="ti ti-notes text-lg text-[var(--color-accent)] shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Observability Blog</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Short write-ups</p>
        </div>
        <i className="ti ti-chevron-right text-xs text-[var(--color-text-tertiary)]" aria-hidden="true" />
      </button>

      <button
        onClick={onRoadmapClick}
        className="text-left p-4 flex items-center gap-3 hover:bg-[var(--color-surface-hover)] transition-colors"
      >
        <i className="ti ti-rocket text-lg text-[var(--color-accent)] shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Coming Soon</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">What's next</p>
        </div>
        <i className="ti ti-chevron-right text-xs text-[var(--color-text-tertiary)]" aria-hidden="true" />
      </button>
    </div>
  )
}
