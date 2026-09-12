const ROADMAP_ITEMS = [
  {
    title: 'Self-serve demo provisioning',
    detail:
      'Right now a demo request lands in my inbox and I trigger the build by hand. Next step is a request that kicks off the CodeBuild pipeline directly and emails back a live URL once ArgoCD reports healthy, with an automatic teardown after the session expires.',
  },
  {
    title: 'More open source',
    detail:
      'Pyroscope for continuous profiling, Grafana Alloy as the collector distribution, and OpenCost for real-time cost observability alongside the existing Mimir long-term metrics backend.',
  },
  {
    title: 'Chaos engineering',
    detail:
      'Trigger infrastructure failures and their automated remediations to test the resilience of the system and its components.',
  },
  {
    title: 'IDP / SSO',
    detail:
      'Keycloak deployed in-cluster as an open source OIDC identity provider, with ArgoCD and Grafana federated via OAuth2 for single sign-on and role-based access control.',
  },
]

export default function RoadmapDetail() {
  return (
    <div>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
        What I am working on now:
      </p>

      <div className="space-y-3">
        {ROADMAP_ITEMS.map((item) => (
          <div
            key={item.title}
            className="flex gap-3 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-4 py-3"
          >
            <i
              className="ti ti-circle-dashed text-lg text-[var(--color-text-tertiary)] shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium mb-1">{item.title}</p>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {item.detail}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
