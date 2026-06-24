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

