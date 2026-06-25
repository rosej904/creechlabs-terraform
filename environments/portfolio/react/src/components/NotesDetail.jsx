const PLACEHOLDER_POSTS = [
  {
    title: 'Centralized Observability vs Culture',
    excerpt:
      'Todays IT consist of modern tech moving at lightning speed, AI Agents, legacy systems, and hybrid environments all intertwined with hundreds or thousands of micro-services. Some of the major challenges Ive had to solve include managing high cardinality data, tons of sources with non-standard data sets, the covetedsingle-pane-of-glass, ensuring signals have context, and of course - effective user enablement, ',
  },
  {
    title: 'Enabling the Dev: SRE & Observability-as-a-Service',
    excerpt:
      'Everything-as-Code and Everything-as-a-Service! Observibility and SRE concepts are key to modern DevOps practices and can be made available as catalog offerings while SRE policy enforcement is enabled at the platform level. This enables developers to effectively implement these core features without spending valuable cycles.',
  },
  {
    title: 'My shifted focus in IT at this stage in my career: Value and Engineering with Best Practices',
    excerpt:
      'Ive been in enterprise IT for over 15 years. Today I ensure some core concepts are at the center of all of my work and thinking. As IT we should be providing value to the business and as an engineer I focus on delivering solutions towards that goal. I thoroughly enjoy discovery, solutioning, architecture, and implementation. During these phases I focus on some industry leading best practices - AWS Well-Architected Framework, Continuous Reliability & SLO-Driven Operations (Google SRE Framework), OTel Symantic Conventions, Ephemaral Infrastructure from 12 factor methodology, and IaC/EaC.',
  }
]

export default function NotesDetail() {
  return (
    <div>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
        I love talking shop and sharing my real experiences and challenges within modernizing observability and infrastructure: Ask me about the topics below.
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
        
        <a
          href="mailto:jordan_rose@creechlabs.dev"
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          aria-label="Email"
        >
          
          <i className="ti ti-mail text-lg mr-2" aria-hidden="true" />
          Reach me on email: Jordan_Rose@creechlabs.dev
        </a>
      </div>
    </div>
  )
}