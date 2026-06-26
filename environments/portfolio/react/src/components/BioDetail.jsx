import { useState, useCallback } from 'react'

// ─────────────────────────────────────────────────────────
// Add filenames here when you drop photos into
// public/images/bio/. Order here = order in carousel.
// ─────────────────────────────────────────────────────────
const PHOTOS = [
  'image1.jpg',
  'image2.heic',
  'image3.jpg',
  'image4.jpg',
  'image5.jpg',
  'image6.jpg',
  'image7.jpg',
  'image8.jpg',
  'image9.jpg',
  'image10.jpg',
  'image11.jpg',
  'image12.heic',
  'image13.jpg'
]

const BASE_PATH = '/images/bio/'

function PhotoCarousel() {
  const [current, setCurrent] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [failedSrcs, setFailedSrcs] = useState(new Set())

  const visible = PHOTOS.filter((f) => !failedSrcs.has(f))
  const count = visible.length

  const prev = useCallback(() => {
    setLoaded(false)
    setCurrent((i) => (i - 1 + count) % count)
  }, [count])

  const next = useCallback(() => {
    setLoaded(false)
    setCurrent((i) => (i + 1) % count)
  }, [count])

  const captureStart = (e) => {
    e.currentTarget._touchStartX = e.touches[0].clientX
  }
  const handleTouchEnd = (e) => {
    const startX = e.currentTarget._touchStartX
    if (startX === undefined) return
    const dx = e.changedTouches[0].clientX - startX
    if (Math.abs(dx) > 50) dx < 0 ? next() : prev()
  }

  if (count === 0) return null

  const src = BASE_PATH + visible[current]
  const nextSrc = count > 1 ? BASE_PATH + visible[(current + 1) % count] : null

  return (
    <div className="mb-6">
      {/* Fixed height container — never collapses between image loads */}
      <div
        className="relative bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl overflow-hidden"
        style={{ height: '340px' }}
        onTouchStart={captureStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Loading skeleton — visible until image loads */}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" />
          </div>
        )}

        <img
          src={src}
          alt={`Photo ${current + 1} of ${count}`}
          className="w-full h-full object-contain transition-opacity duration-300"
          style={{ opacity: loaded ? 1 : 0 }}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailedSrcs((s) => new Set([...s, visible[current]]))
            setLoaded(true)
          }}
        />

        {/* Preload next image silently so it's cached before user navigates */}
        {nextSrc && <img src={nextSrc} className="hidden" alt="" aria-hidden="true" />}

        {count > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg bg-black/40 hover:bg-black/60 text-white transition-colors"
            >
              <i className="ti ti-chevron-left text-sm" aria-hidden="true" />
            </button>
            <button
              onClick={next}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg bg-black/40 hover:bg-black/60 text-white transition-colors"
            >
              <i className="ti ti-chevron-right text-sm" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {/* Dot indicators — hidden when only 1 photo */}
      {count > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {visible.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to photo ${i + 1}`}
              className={`rounded-full transition-all duration-200 ${i === current
                ? 'w-4 h-1.5 bg-[var(--color-accent)]'
                : 'w-1.5 h-1.5 bg-[var(--color-text-tertiary)] hover:bg-[var(--color-text-secondary)]'
                }`}
            />
          ))}
        </div>
      )}
      <p className="text-sm text-[var(--color-text-tertiary)] leading-relaxed mb-4">
        Beyond My Professional Career: I have an amazing family, of course including our doberman Anri, I love to travel, could eat hot wings every day, and absolutely love to ski (yes I live in Florida)!
      </p>
    </div>
  )
}

export default function BioDetail() {
  return (
    <div>
      <PhotoCarousel />

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-[var(--color-accent-dim)] flex items-center justify-center text-base font-medium text-[var(--color-accent)] shrink-0">
          JC
        </div>
        <div>
          <p className="font-medium text-base">Jordan Rose</p>
          <p className="text-sm text-[var(--color-text-secondary)]">Sr Infrastructure Engineer / Observability Specialist / SRE</p>
        </div>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
        15+ years in infrastructure engineering, enterprise IT, and a passion for automation and observability. Certified AWS Solutions Architect, Kuberenetes Admin, OTel and Observability Expert.
      </p>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
        Currently I drive and champion centralized end-to-end observability services and culture accross our enterprise and the multiple companies I support.
        I work in hybrid on-prem & cloud environments, with every tech stack and vendor a large enterprise can dream up, and implement SRE practices into our DevOps lifecycle.
      </p>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-1">
        Previous Role: CSX Technology
      </p>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
        Current Role: Florida Blue / Guidewell
      </p>
      <div className="border-t border-[var(--color-border)] pt-5">
        <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-3 uppercase tracking-wide">
          Find me on
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href="https://www.linkedin.com/in/jordan-c-rose/" target="_blank" rel="noopener noreferrer"
            className="text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-2.5 py-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] inline-flex items-center gap-1"
          >
            <i className="ti ti-brand-linkedin" aria-hidden="true" /> LinkedIn
          </a>
          <a
            href="https://github.com/rosej904/creechlabs-terraform" target="_blank" rel="noopener noreferrer"
            className="text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-2.5 py-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] inline-flex items-center gap-1"
          >
            <i className="ti ti-brand-github" aria-hidden="true" /> GitHub
          </a>
          <a
            href="mailto:jordan_rose@creechlabs.dev"
            className="text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-2.5 py-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] inline-flex items-center gap-1"
          >
            <i className="ti ti-mail" aria-hidden="true" /> Email
          </a>
        </div>
      </div>
    </div>
  )
}
