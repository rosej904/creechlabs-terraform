const PLACEHOLDER_POSTS = [
  {
    title: 'Why I correlate traces to logs instead of just dashboards',
    date: 'Placeholder date',
    excerpt:
      'Placeholder excerpt — a few sentences on the reasoning behind the Tempo-to-Loki link setup and why it matters for debugging.',
  },
  {
    title: 'Destroying my cluster every night on purpose',
    date: 'Placeholder date',
    excerpt:
      'Placeholder excerpt — notes on the cost/learning tradeoffs of a nightly destroy/rebuild cycle for a demo environment.',
  },
  {
    title: 'Getting ArgoCD app-of-apps right',
    date: 'Placeholder date',
    excerpt:
      'Placeholder excerpt — patterns that worked, patterns that didn\u2019t, for managing many ArgoCD child apps from one root.',
  },
]

export default function NotesDetail() {
  return (
    <div>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
        Short write-ups on observability, infrastructure, and what building
        this project taught me. Placeholder content for now.
      </p>

      <div className="space-y-4">
        {PLACEHOLDER_POSTS.map((post) => (
          <div
            key={post.title}
            className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-4"
          >
            <p className="text-xs text-[var(--color-text-tertiary)] mb-1">{post.date}</p>
            <p className="font-medium text-sm mb-1.5">{post.title}</p>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
              {post.excerpt}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}