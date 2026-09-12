import { useState } from 'react'
import Modal from './Modal'
import DemoRequestButton from './DemoRequestButton'
import { demoCopy } from '../config/demoMode'

/**
 * Screenshots live in public/images/demo/. Shoot them at 2x (retina) and
 * save as PNG or WebP — JPEG artifacts ruin Grafana's thin gridlines and
 * 11px axis labels. Pick panels that read as *shapes* at thumbnail size.
 */
const SHOTS = [
  {
    src: '/images/demo/slo-burn.png',
    label: 'SLO burn-rate alerting',
    caption: 'Multi-window multi-burn-rate, fast and slow windows on one panel.',
  },
  {
    src: '/images/demo/trace-waterfall.png',
    label: 'Trace waterfall',
    caption: 'A single request across otel-demo services in Tempo.',
  },
  {
    src: '/images/demo/service-map.png',
    label: 'Service map',
    caption: 'Dependencies and error rates derived from span metrics.',
  },
  {
    src: '/images/demo/logs-correlation.png',
    label: 'Trace to logs',
    caption: 'Jumping from a span straight into the matching Loki lines.',
  },
]

// Each tile's label sits in its OUTER corner so nothing collides with the
// centred CTA card, which covers the point where the four panels meet.
const CHIP_CORNER = [
  'top-2 left-2',
  'top-2 right-2',
  'bottom-2 left-2',
  'bottom-2 right-2',
]

function Thumb({ shot, index, onOpen }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="relative h-full w-full min-h-0 rounded-xl border border-dashed border-[var(--color-border)] flex flex-col items-center justify-center gap-2 p-4 text-center">
        <i className="ti ti-photo-off text-xl text-[var(--color-text-tertiary)]" aria-hidden="true" />
        <p className="text-xs text-[var(--color-text-tertiary)]">{shot.label}</p>
      </div>
    )
  }

  return (
    <button
      onClick={onOpen}
      className="group relative h-full w-full min-h-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] transition-colors hover:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      aria-label={`View ${shot.label} full size`}
    >
      <img
        src={shot.src}
        alt={shot.label}
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover object-top transition-opacity group-hover:opacity-95"
      />
      {/* Label chip — outer corner, with the zoom affordance folded in so
          there is no second element to collide with the CTA. */}
      <span
        className={`pointer-events-none absolute ${CHIP_CORNER[index]} flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-[var(--color-text-secondary)] backdrop-blur-sm transition-colors group-hover:text-[var(--color-accent)]`}
        style={{ backgroundColor: 'rgba(13,17,23,0.72)' }}
      >
        {shot.label}
        <i className="ti ti-maximize text-xs opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
      </span>
    </button>
  )
}

export default function DemoShowcase() {
  const [lightbox, setLightbox] = useState(null) // index or null

  const shot = lightbox !== null ? SHOTS[lightbox] : null
  const step = (delta) => setLightbox((i) => (i + delta + SHOTS.length) % SHOTS.length)

  return (
    <div className="relative h-full w-full min-h-0 overflow-hidden rounded-b-2xl">
      {/* Screenshot grid — unblurred, this is the exhibit */}
      <div className="grid h-full min-h-0 grid-cols-2 grid-rows-2 gap-2 p-2">
        {SHOTS.map((s, i) => (
          <Thumb key={s.src} shot={s} index={i} onOpen={() => setLightbox(i)} />
        ))}
      </div>

      {/* Vignette — darkens toward the CTA without hiding the panels.
          pointer-events-none so thumbnails stay clickable. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 58% 50% at 50% 50%, rgba(13,17,23,0.92) 0%, rgba(13,17,23,0.78) 40%, rgba(13,17,23,0.22) 72%, rgba(13,17,23,0) 100%)',
        }}
        aria-hidden="true"
      />

      {/* CTA card — dead centre, over the point where the four panels meet */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 md:p-6">
        <div
          className="pointer-events-auto w-full max-w-xl rounded-2xl border border-[var(--color-border)] px-5 py-4 text-center backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(13,17,23,0.9)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
          }}
        >
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            {demoCopy.showcase.heading}
          </p>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-[var(--color-text-secondary)]">
            {demoCopy.showcase.body}
          </p>
          <div className="mt-3.5 flex justify-center">
            <DemoRequestButton variant="primary" />
          </div>
          <p className="mt-2.5 text-[11px] text-[var(--color-text-tertiary)]">
            {demoCopy.showcase.footnote}
          </p>
        </div>
      </div>

      {lightbox !== null && (
        <Modal title={shot.label} onClose={() => setLightbox(null)} wide>
          <div className="flex flex-col gap-4">
            <img
              src={shot.src}
              alt={shot.label}
              className="w-full rounded-xl border border-[var(--color-border)]"
            />
            <div className="flex items-center gap-4">
              <p className="flex-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                {shot.caption}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  {lightbox + 1} / {SHOTS.length}
                </span>
                <button
                  onClick={() => step(-1)}
                  aria-label="Previous screenshot"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)]"
                >
                  <i className="ti ti-chevron-left text-base" aria-hidden="true" />
                </button>
                <button
                  onClick={() => step(1)}
                  aria-label="Next screenshot"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)]"
                >
                  <i className="ti ti-chevron-right text-base" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
