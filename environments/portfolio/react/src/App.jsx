import { useState, useRef, useEffect } from 'react'
import Hero from './components/Hero'
import StatusStrip from './components/StatusStrip'
import FaultInjectionStrip from './components/FaultInjectionStrip'
import GrafanaPanel from './components/GrafanaPanel'
import TileStack from './components/TileStack'
import MobileLayout from './components/MobileLayout'
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

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
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
  const { status, error, loading } = useInfraStatus()
  const headerRef = useRef(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!headerRef.current) return
    const observer = new ResizeObserver(([entry]) => {
      setHeaderHeight(entry.contentRect.height)
    })
    observer.observe(headerRef.current)
    return () => observer.disconnect()
  }, [])

  const modalContent = {
    infra:         { title: 'The infrastructure',         body: <InfraDetail status={status} loading={loading} error={error} /> },
    devops:        { title: 'DevOps and delivery',         body: <DevopsDetail /> },
    observability: { title: 'Observability',               body: <ObservabilityDetail status={status} /> },
    cicd:          { title: 'Daily apply / destroy cycle', body: <CicdDetail /> },
    frontend:      { title: 'The frontend',                body: <FrontendDetail /> },
    notes:         { title: 'Notes on observability',      body: <NotesDetail /> },
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
        <div ref={headerRef}>
          <Hero onBioClick={() => setExpandedTile('bio')} />
          <StatusStrip status={status} />
          <FaultInjectionStrip status={status} />
        </div>

        {isMobile ? (
          /* ── Mobile: tab + swipe layout ── */
          <MobileLayout
            grafanaPanel={<GrafanaPanel status={status} />}
            tileStack={<TileStack {...tileStackProps} className="p-3" />}
            headerHeight={headerHeight}
          />
        ) : (
          /* ── Desktop: sticky left + scrollable right ── */
          <div
            className="flex gap-4"
            style={{ height: `calc(100vh - ${headerHeight}px - 5rem)` }}
          >
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0">
                <GrafanaPanel status={status} />
              </div>
              <Footer />
            </div>

            <div className="w-80 shrink-0 overflow-y-auto pr-1">
              <TileStack {...tileStackProps} />
            </div>
          </div>
        )}

      </div>

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
