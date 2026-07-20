# ------------------------------------------------------------
# PriorityClass — stable-node-critical
# ------------------------------------------------------------
resource "kubectl_manifest" "stable_node_priority_class" {
  yaml_body = yamlencode({
    apiVersion = "scheduling.k8s.io/v1"
    kind       = "PriorityClass"
    metadata = {
      name = "stable-node-critical"
    }
    value          = 1000000
    globalDefault  = false
    description    = "Grafana — allowed to preempt lower-priority pods on the stable node when it can't otherwise schedule"
  })
}