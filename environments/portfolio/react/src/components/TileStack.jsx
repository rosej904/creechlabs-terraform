import ListTile from './ListTile'
import StackedTile from './StackedTile'
import InfraTeaser from './diagrams/teasers/InfraTeaser'
import DevopsTeaser from './diagrams/teasers/DevopsTeaser'
import ObservabilityTeaser from './diagrams/teasers/ObservabilityTeaser'
import CicdTeaser from './diagrams/teasers/CicdTeaser'
import FrontendTeaser from './diagrams/teasers/FrontendTeaser'

const TILES = [
  { id: 'infra',        title: 'Infrastructure',        blurb: 'Terraform, EKS, networking — layered IaC', Diagram: InfraTeaser },
  { id: 'devops',       title: 'DevOps / delivery',     blurb: 'Git → ArgoCD → cluster',                  Diagram: DevopsTeaser },
  { id: 'observability',title: 'Observability',         blurb: 'Prometheus · Loki · Tempo · Grafana',     Diagram: ObservabilityTeaser },
  { id: 'cicd',         title: 'Daily apply / destroy', blurb: 'Scheduled rebuild every weekday',         Diagram: CicdTeaser },
  { id: 'frontend',     title: 'Frontend',              blurb: 'React + Vite on S3 + CloudFront',         Diagram: FrontendTeaser },
]

export default function TileStack({ onTileClick, onNotesClick, onRoadmapClick, onBioClick, className = '' }) {
  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {TILES.map((tile) => (
        <ListTile
          key={tile.id}
          title={tile.title}
          blurb={tile.blurb}
          diagram={<tile.Diagram />}
          onClick={() => onTileClick(tile.id)}
        />
      ))}
      <StackedTile
        onNotesClick={onNotesClick}
        onRoadmapClick={onRoadmapClick}
        onBioClick={onBioClick}
      />
    </div>
  )
}
