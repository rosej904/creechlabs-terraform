/**
 * Renders a static diagram image from /public/diagrams.
 *
 * Drop exported files into public/diagrams/ using this naming convention:
 *   infra-full.svg        infra-teaser.svg
 *   devops-full.svg       devops-teaser.svg
 *   observability-full.svg  observability-teaser.svg
 *   cicd-full.svg          cicd-teaser.svg
 *
 * SVG, PNG, or JPG all work — just update the extension below if you
 * export as PNG instead of SVG.
 */
export default function DiagramImage({ name, variant = 'full', className = '', alt }) {
  return (
    <img
      src={`/diagrams/${name}-${variant}.svg`}
      alt={alt}
      className={`${className} max-h-[70vh] w-auto mx-auto object-contain`}
      loading="lazy"
    />
  )
}

