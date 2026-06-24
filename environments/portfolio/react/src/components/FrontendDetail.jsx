import DiagramImage from './diagrams/DiagramImage'

export default function FrontendDetail() {
  return (
    <div>
      <DiagramImage name="frontend" variant="full" className="w-full mb-6" alt="Frontend architecture diagram" />

      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-4">
        This frontend site is fully decoupled from this project. It is deployed as a static site on S3 fronted by CloudFront.
      </p>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
        Real infra/app status is checked and displayed via local function that calls back to a lambda function via cloudfront and api gateway. Then content is logically rendered based on whether resources are available.
      </p>

      <div className="border-t border-[var(--color-border)] pt-5">
        <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-3 uppercase tracking-wide">
          Stack
        </p>
        <div className="flex flex-wrap gap-2">
          {['React (built with Vite) and Tailwind CSS', 'Serverless Static Site on S3 & Cloudfront'].map((tag) => (
            <span
              key={tag}
              className="text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-2.5 py-1 text-[var(--color-text-secondary)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
