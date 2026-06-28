import { useState, useEffect, lazy, Suspense } from 'react'
import Hero from './components/Hero'
import StatusStrip from './components/StatusStrip'
import FaultInjectionStrip from './components/FaultInjectionStrip'
import ProjectContextStrip from './components/ProjectContextStrip'
import GrafanaPanel from './components/GrafanaPanel'
const AwsResourceTable = lazy(() => import('./components/AwsResourceTable'))
import TileStack from './components/TileStack'
import Modal from './components/Modal'
import Footer from './components/Footer'
import InfraDetail from './components/InfraDetail'
import DevopsDetail from './components/DevopsDetail'
import ObservabilityDetail from './components/ObservabilityDetail'
import CicdDetail from './components/CicdDetail'
import FrontendDetail from './components/FrontendDetail'
import NotesDetail from './components/NotesDetail'
import BioDetail from './components/BioDetail'
import RoadmapDetail from './components/RoadmapDetail'
import { useInfraStatus } from './hooks/useInfraStatus'
import AnriWidget from './components/AnriWidget'


function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia('(max-width: 767px)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

function App() {
  const [expandedTile, setExpandedTile] = useState(null)
  const [showTopology, setShowTopology] = useState(false)
  const [mobileTab, setMobileTab] = useState(1)
  const { status, error, loading } = useInfraStatus()
  const isMobile = useIsMobile()

  const modalContent = {
    infra:         { title: 'The infrastructure',          body: <InfraDetail status={status} loading={loading} error={error} /> },
    devops:        { title: 'DevOps and Delivery',         body: <DevopsDetail /> },
    observability: { title: 'Observability',               body: <ObservabilityDetail status={status} /> },
    cicd:          { title: 'Daily apply / Destroy cycle', body: <CicdDetail /> },
    frontend:      { title: 'The frontend',                body: <FrontendDetail /> },
    notes:         { title: 'Ask  me About',               body: <NotesDetail /> },
    bio:           { title: 'About me',                    body: <BioDetail /> },
    'coming-soon': { title: "What's next",                 body: <RoadmapDetail /> },
  }

  const tileStackProps = {
    onTileClick:    setExpandedTile,
    onNotesClick:   () => setExpandedTile('notes'),
    onRoadmapClick: () => setExpandedTile('coming-soon'),
    onBioClick:     () => setExpandedTile('bio'),
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-10 md:py-12">
      <div className="max-w-[1800px] mx-auto">

        {/* Full-width header */}
        <div>
          <Hero onBioClick={() => setExpandedTile('bio')} />
          <StatusStrip status={status} onTopologyClick={() => setShowTopology(true)} />
          <ProjectContextStrip />
          {!isMobile && <FaultInjectionStrip status={status} />}
        </div>

        {isMobile ? (
          /* ── Mobile: simple scrollable stack ── */
          <div className="flex flex-col gap-3">
            {/* Tab bar to switch between Grafana and tiles */}
            <div className="flex bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-1 shrink-0"
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              {[{ label: 'Dashboard', icon: 'ti-chart-dots-3' }, { label: 'Explore', icon: 'ti-stack-2' }].map((tab, i) => (
                <button
                  key={tab.label}
                  onClick={() => setMobileTab(i)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm transition-colors ${
                    mobileTab === i
                      ? 'bg-[var(--color-bg)] text-[var(--color-text-primary)] font-medium'
                      : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  <i className={`ti ${tab.icon} text-base`} aria-hidden="true" />
                  {tab.label}
                </button>
              ))}
            </div>

            {mobileTab === 0 ? (
              /* Dashboard panel — fixed height iframe */
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden" style={{ height: '70vh' }}>
                <GrafanaPanel status={status} />
              </div>
            ) : (
              /* Explore panel — natural height, page scrolls */
              <TileStack {...tileStackProps} />
            )}

            <Footer />
          </div>
        ) : (
          /* ── Desktop: sticky left + scrollable right ── */
          <div
            className="flex gap-4"
            style={{ height: 'calc(100dvh - 18rem)',  minHeight: '800px'  }}
          >
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden" style={{ minHeight: '800px' }}>
              <div className="flex-1 min-h-0">
                <GrafanaPanel status={status} />
              </div>
              <Footer />
            </div>

            <div className="relative w-80 shrink-0 flex flex-col">
              <div className="flex-1 overflow-y-auto pr-1">
                <TileStack {...tileStackProps} />
              </div>
              {/* Bubble anchored to bottom of right column on desktop */}
              <div className="sticky bottom-8 flex justify-end pt-3 pr-1 shrink-0 mx-6">
                <AnriWidget
                  grafanaStatus={status?.apps?.detail?.grafana?.status}
                  bubbleStyle={{ position: 'relative', zIndex: 50 }}
                />
              </div>
            </div>
          </div>
        )}

      </div>

    {/* Mobile-only fixed bubble — desktop uses the one inside the right column */}
    {isMobile && <AnriWidget grafanaStatus={status?.apps?.detail?.grafana?.status} />}

      {showTopology && (
        <Modal title="Live AWS resources" onClose={() => setShowTopology(false)}>
          <Suspense fallback={<div className="flex items-center justify-center h-32 text-[var(--color-text-tertiary)]"><i className="ti ti-loader animate-spin text-2xl" /></div>}>
            <AwsResourceTable />
          </Suspense>
        </Modal>
      )}

      {expandedTile && modalContent[expandedTile] && (
        <Modal
          title={modalContent[expandedTile].title}
          onClose={() => setExpandedTile(null)}
          wide={expandedTile === 'observability'}
        >
          {modalContent[expandedTile].body}
        </Modal>
      )}
    </div>
  )
}

export default App
