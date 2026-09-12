/**
 * Single source of truth for how the live demo is exposed.
 *
 *   'scheduled'  → EventBridge rules enabled; cluster is up weekdays 9am–5pm ET
 *   'on-demand'  → EventBridge rules disabled; cluster is built per request
 *
 * Flip DEMO_MODE and every string below follows. Nothing else in the app
 * should hardcode the schedule.
 */
export const DEMO_MODE = 'on-demand'

export const IS_ON_DEMAND = DEMO_MODE === 'on-demand'

export const SCHEDULE_WINDOW = 'weekdays 9am–5pm ET'
export const PROVISION_ETA = 'about 20 minutes'

/** Where demo requests land. Also used as the mailto fallback target. */
export const DEMO_CONTACT_EMAIL = 'demo@creechlabs.dev'

/**
 * Set to '/api/demo-request' once the SES-backed Lambda route is live.
 * While null, the request form falls back to a prefilled mailto: link.
 */
export const DEMO_REQUEST_ENDPOINT = null

export const demoCopy = {
  /* Hero — desktop */
  heroLong: IS_ON_DEMAND
    ? 'Welcome to my semi-production-grade playground, evolved from a personal testing environment. Everything here is ephemeral and declarative: the whole stack is built from an empty account on request and destroyed afterwards, driven 100% by EaC/IaC.'
    : 'Welcome to my semi-production-grade playground, evolved from a personal testing environment. This is an ephemeral, declarative, automated environment that is destroyed and rebuilt every day, driven 100% by EaC/IaC.',

  /* Hero — mobile */
  heroShort: IS_ON_DEMAND
    ? 'Ephemeral, declarative infrastructure — EKS, GitOps via ArgoCD, and a full observability stack. Built from scratch on request.'
    : 'Ephemeral, declarative infrastructure — EKS, GitOps via ArgoCD, and a full observability stack. Rebuilt every day.',

  /* CicdDetail body */
  cicdBody: IS_ON_DEMAND
    ? `The EKS cluster and everything it hosts is built from nothing and destroyed completely, run through CodeBuild. This is not a scale-down — the cluster and its workloads cease to exist between demos, which is why the running cost is $0/day. A full build takes ${PROVISION_ETA}. The EventBridge schedules that drove this every weekday are currently disabled; builds are triggered per request.`
    : 'The EKS cluster and everything it hosts is fully destroyed every evening and rebuilt every weekday morning, scheduled with EventBridge and run through CodeBuild. This is not a scale-down — the cluster and its workloads are fully ephemeral and cease to exist entirely between 5pm and 9am ET.',

  /* CicdDetail — lifecycle table */
  cicdPersistedRow: IS_ON_DEMAND
    ? 'dns-tls, cicd (CodeBuild projects; EventBridge schedules present but disabled), bootstrap (S3), mimir-storage'
    : 'dns-tls, cicd (CodeBuild projects and EventBridge schedules), bootstrap (S3), mimir-storage',
  cicdEphemeralLabel: IS_ON_DEMAND ? 'Built per demo' : 'Rebuilt daily',

  /* GrafanaPanel context bar */
  panelBar: IS_ON_DEMAND
    ? 'Observability demo · built on request — otel-demo app · SLO burn-rate alerting · Grafana · Prometheus · Loki · Tempo'
    : `Live observability demo: online ${SCHEDULE_WINDOW} — otel-demo app · SLO burn-rate alerting · Grafana · Prometheus · Loki · Tempo`,

  /* GrafanaChatPanel context bar */
  chatPanelBar: IS_ON_DEMAND
    ? 'LLM observability demo · built on request — AI Workloads · Metering'
    : `LLM observability demo: online ${SCHEDULE_WINDOW} — AI Workloads · Metering`,

  /* GrafanaChatPanel idle body */
  chatPanelIdle: IS_ON_DEMAND
    ? 'The cluster is idle right now. Request a demo and the live LLM observability dashboard loads here alongside this chat.'
    : `Visit ${SCHEDULE_WINDOW} to see the live LLM observability dashboard alongside this chat.`,

  /* FaultInjectionStrip, when otel-demo is not up */
  faultStripIdle: IS_ON_DEMAND
    ? 'Fault injection needs a running cluster —'
    : `Stack will be back online ${SCHEDULE_WINDOW}`,

  /* ProjectContextStrip */
  contextWhat: IS_ON_DEMAND
    ? 'Production-grade observability on a $0/day budget — EKS, ArgoCD, and the full LGTM stack built from scratch on request, then torn down to nothing.'
    : 'Production-grade observability on a $0/day budget — EKS, ArgoCD, and the full LGTM stack rebuilt automatically every morning and torn down every night.',

  contextHow: IS_ON_DEMAND
    ? `Fully ephemeral — EKS, networking, and every workload is declared in Terraform and ArgoCD. The whole stack builds from an empty account in ${PROVISION_ETA} and leaves no always-on compute behind.`
    : 'Fully ephemeral — EKS, networking, and all workloads are declared in Terraform and ArgoCD. The entire stack is torn down at 5pm ET and rebuilt from scratch at 9am, automatically, every weekday.',

  /* TileStack — cicd tile */
  cicdTileBlurb: IS_ON_DEMAND
    ? 'Full build from empty, torn down to $0'
    : 'Scheduled rebuild every weekday',

  /* AwsResourceTable */
  resourcesUnavailable: IS_ON_DEMAND
    ? 'Status API unreachable'
    : 'Stack offline — weekdays 9am–5pm ET',

  resourcesEmpty: IS_ON_DEMAND
    ? 'No ephemeral resources exist right now. The cluster, nodes, load balancer, and VPC are created per demo and destroyed afterwards — the rows below appear once a build runs.'
    : 'No ephemeral resources exist right now. They are rebuilt on the next scheduled run.',

  resourcesFootnote: IS_ON_DEMAND
    ? 'Ephemeral resources are created from infrastructure-as-code per demo and destroyed afterwards.'
    : 'All ephemeral resources are destroyed nightly at 5pm ET and rebuilt from infrastructure-as-code at 9am ET weekdays.',

  /* DemoShowcase overlay */
  showcase: {
    heading: 'See it running',
    body: IS_ON_DEMAND
      ? `Nothing is running right now — that is the point. Request a demo and the cluster, GitOps sync, and telemetry pipelines build from scratch in ${PROVISION_ETA}, then you get a link.`
      : `The cluster runs ${SCHEDULE_WINDOW}. Request a demo for a window outside that.`,
    cta: 'Request a demo',
    footnote: 'Requests are handled by hand today. Self-serve provisioning is next.',
    building:
      'A build is running right now — the cluster, GitOps sync, and telemetry pipelines are coming up. This panel goes live on its own when Grafana starts answering.',
  },
}

/** Status pill label shared by both Grafana panels. */
export function statusLabel(status) {
  switch (status) {
    case 'up':
      return 'Status: Up'
    case 'down':
      return 'Status: Degraded'
    case 'stopped':
      return IS_ON_DEMAND ? 'Status: Standby' : 'Status: Scheduled offline'
    case 'provisioning':
      return 'Status: Building'
    default:
      return ''
  }
}
