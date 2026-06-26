const ROADMAP_ITEMS = [
  {
    title: 'More Open Source!',
    detail: 'Pyroscope - continous profiling, Grafana Alloy - Grafana Labs otel distribution, OpenCost - Real time cost observability, Mimir - Prometheues backend storage',
  },
  {
    title: 'LLM + MCP',
    detail: 'On-site observability chatbot powered by Claude (potentially other LLMs) and a Grafana MCP server deployed in-cluster — ask natural language questions about live metrics, logs, traces, and alerts.',
  },
  {
    title: 'Chaos Engineering',
    detail: 'Trigger an infrastructure failure and its automated remediations to test the resilience of the system and its components',
  },
  {
    title: 'IDP / SSO',
    detail: 'Keycloak deployed in-cluster as an open source OIDC identity provider, with ArgoCD and Grafana federated via OAuth2 for single sign-on and role-based access control.',
  }
]

export default function RoadmapDetail() {
  return (
    <div>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-6">
        What I'm working on now:
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