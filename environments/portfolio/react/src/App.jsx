import { useState } from 'react'
import Hero from './components/Hero'
import StatusStrip from './components/StatusStrip'
import Tile from './components/Tile'
import StackedTile from './components/StackedTile'
import Modal from './components/Modal'
import Footer from './components/Footer'
import InfraDetail from './components/InfraDetail'
import DevopsDetail from './components/DevopsDetail'
import ObservabilityDetail from './components/ObservabilityDetail'
import CicdDetail from './components/CicdDetail'
import NotesDetail from './components/NotesDetail'
import BioDetail from './components/BioDetail'
import RoadmapDetail from './components/RoadmapDetail'
import FrontendDetail from './components/FrontendDetail'
import InfraTeaser from './components/diagrams/teasers/InfraTeaser'
import DevopsTeaser from './components/diagrams/teasers/DevopsTeaser'
import ObservabilityTeaser from './components/diagrams/teasers/ObservabilityTeaser'
import CicdTeaser from './components/diagrams/teasers/CicdTeaser'
import FrontendTeaser from './components/diagrams/teasers/FrontendTeaser'
import { useInfraStatus } from './hooks/useInfraStatus'

function App() {
  const [expandedTile, setExpandedTile] = useState(null)
  const { status, error, loading } = useInfraStatus()

  const modalContent = {
    observability: {
      title: 'Observability',
      body: <ObservabilityDetail status={status} />,
    },
    infra: {
      title: 'The infrastructure',
      body: <InfraDetail status={status} loading={loading} error={error} />,
    },
    devops: {
      title: 'DevOps and Delivery',
      body: <DevopsDetail />,
    },
    frontend: {
      title: 'Frontend',
      body: <FrontendDetail />,
    },
    cicd: {
      title: 'Daily apply / destroy cycle',
      body: <CicdDetail />,
    },
    notes: {
      title: 'Notes on observability',
      body: <NotesDetail />,
    },
    bio: {
      title: 'About me',
      body: <BioDetail />,
    },
    'coming-soon': {
      title: "What's next",
      body: <RoadmapDetail />,
    },
  }

  return (
    <div className="min-h-screen px-4 py-10 md:px-10 md:py-16">
      <div className="max-w-7xl mx-auto">
        <Hero onBioClick={() => setExpandedTile('bio')} />
        <StatusStrip status={status} />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Tile
            title="Observability"
            diagram={<ObservabilityTeaser />}
            onClick={() => setExpandedTile('observability')}
          />
          <Tile
            title="DevOps / Delivery"
            diagram={<DevopsTeaser />}
            onClick={() => setExpandedTile('devops')}
          />
          <Tile
            title="Frontend"
            diagram={<FrontendTeaser />}
            onClick={() => setExpandedTile('frontend')}
          />
          <Tile
            title="Infrastructure"
            diagram={<InfraTeaser />}
            onClick={() => setExpandedTile('infra')}
          />
          <Tile
            title="Daily apply / destroy"
            diagram={<CicdTeaser />}
            onClick={() => setExpandedTile('cicd')}
          />
          <StackedTile
            onNotesClick={() => setExpandedTile('notes')}
            onRoadmapClick={() => setExpandedTile('coming-soon')}
          />
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] aspect-square flex items-center justify-center">
            <span className="text-xs text-[var(--color-text-tertiary)]"></span>
          </div>
        </div>

        <Footer />
      </div>

      {expandedTile && modalContent[expandedTile] && (
        <Modal title={modalContent[expandedTile].title} onClose={() => setExpandedTile(null)}>
          {modalContent[expandedTile].body}
        </Modal>
      )}
    </div>
  )
}

export default App
