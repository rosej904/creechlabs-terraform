const PLACEHOLDER_POSTS = [
  {
    title: 'The Real Challlenges of User Enablement',
    excerpt:
      'Stay Tuned!',
  },
  {
    title: 'Centralized Observability vs Culture',
    excerpt:
      'Stay Tuned!',
  },
  {
    title: 'High Cardinality Data & Standardization from hundreds of sources',
    excerpt:
      'Stay Tuned!',
  },
    {
    title: 'Enabling the Dev: SRE & Observability-as-a-Service',
    excerpt:
      'Stay Tuned!',
  }
]

export default function NotesDetail() {
  return (
    <div>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
        Here I share my thoughts, real experiences, and challenges with modernizing observability.
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