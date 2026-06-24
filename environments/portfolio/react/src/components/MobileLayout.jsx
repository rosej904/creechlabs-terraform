import { useMobileSwipe } from '../hooks/useMobileSwipe'

const TABS = [
  { label: 'Dashboard', icon: 'ti-chart-dots-3' },
  { label: 'Explore', icon: 'ti-stack-2' },
]

export default function MobileLayout({ grafanaPanel, tileStack, headerHeight = 0 }) {
  const { activePanel, setActivePanel, onTouchStart, onTouchEnd } = useMobileSwipe(2)

  return (
    <div
      className="flex flex-col"
      style={{ height: `calc(100vh - ${headerHeight}px - 3rem)` }}
    >

      {/* Tab bar */}
      <div className="flex bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-1 mb-3 shrink-0">
        {TABS.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActivePanel(i)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-colors ${
              activePanel === i
                ? 'bg-[var(--color-bg)] text-[var(--color-text-primary)] font-medium'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <i className={`ti ${tab.icon} text-base`} aria-hidden="true" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Swipeable panel container */}
      <div
        className="flex-1 min-h-0 overflow-hidden relative"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Slide track */}
        <div
          className="flex h-full min-h-0 transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${activePanel * 50}%)`, width: '200%' }}
        >
          {/* Panel 0 — Grafana */}
          <div className="w-1/2 h-full min-h-0 overflow-hidden">
            {grafanaPanel}
          </div>

          {/* Panel 1 — Tile stack */}
          <div className="w-1/2 h-full min-h-0 overflow-y-auto pb-4">
            {tileStack}
          </div>
        </div>
      </div>

      {/* Swipe hint dots */}
      <div className="flex justify-center gap-2 pt-3 pb-1 shrink-0">
        {TABS.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-200 ${
              activePanel === i
                ? 'w-4 h-1.5 bg-[var(--color-accent)]'
                : 'w-1.5 h-1.5 bg-[var(--color-text-tertiary)]'
            }`}
          />
        ))}
      </div>

    </div>
  )
}
