import { useState, useEffect } from 'react'

const MOCK_RESOURCES = {
  fetched_at: null,
  resources: [
    { service: 'EKS cluster',                 count: 0, cost_30d: null },
    { service: 'EC2 instances (running)',      count: 0, cost_30d: null },
    { service: 'EC2 auto scaling groups',      count: 0, cost_30d: null },
    { service: 'Application load balancer',   count: 0, cost_30d: null },
    { service: 'Load balancer target groups', count: 0, cost_30d: null },
    { service: 'VPC',                          count: 0, cost_30d: null },
    { service: 'Subnets',                      count: 0, cost_30d: null },
    { service: 'API Gateway',                  count: 0, cost_30d: null },
    { service: 'CloudFront',                   count: 0, cost_30d: null },
    { service: 'EventBridge',                  count: 0, cost_30d: null },
    { service: 'CodeBuild',                    count: 0, cost_30d: null },
    { service: 'Lambda functions',             count: 0, cost_30d: null },
    { service: 'S3 buckets',                   count: 0, cost_30d: null },
  ],
}

function formatCost(cost) {
  if (cost === null || cost === undefined || cost === 0) return '$0.00'
  if (cost < 0.01) return '<$0.01'
  return `$${cost.toFixed(2)}`
}

function formatTime(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function AwsResourceTable() {
  const [data, setData]         = useState(null)
  const [loadState, setLoadState] = useState('loading')

  useEffect(() => {
    fetch('/api/resources')
      .then((r) => r.json())
      .then((body) => {
        if (body.status === 'ok') {
          setData(body)
          setLoadState('ok')
        } else {
          setData({ ...MOCK_RESOURCES, fetched_at: null })
          setLoadState('offline')
        }
      })
      .catch(() => {
        setData({ ...MOCK_RESOURCES, fetched_at: null })
        setLoadState('offline')
      })
  }, [])

  const hasCosts = loadState === 'ok'
  const totalCost = data?.resources?.reduce((sum, r) => sum + (r.cost_30d || 0), 0) ?? null

  // Only show rows where resources exist (count > 0)
  const visibleRows = (data?.resources ?? MOCK_RESOURCES.resources).filter((r) => r.count > 0)

  return (
    <div className="min-w-[340px]">

      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {loadState === 'loading' && (
            <>
              <i className="ti ti-loader animate-spin text-sm text-[var(--color-accent)]" aria-hidden="true" />
              <span className="text-xs text-[var(--color-text-tertiary)]">Fetching live data…</span>
            </>
          )}
          {loadState === 'ok' && (
            <>
              <span className="w-2 h-2 rounded-full bg-[var(--color-status-up)] shrink-0" />
              <span className="text-xs text-[var(--color-status-up)] font-medium">Live</span>
              {data?.fetched_at && (
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  · fetched at {formatTime(data.fetched_at)}
                </span>
              )}
            </>
          )}
          {loadState === 'offline' && (
            <>
              <span className="w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] shrink-0" />
              <span className="text-xs text-[var(--color-text-tertiary)]">Stack offline — weekdays 8:30am–5:00pm ET</span>
            </>
          )}
        </div>

        {hasCosts && totalCost !== null && (
          <div className="text-right">
            <p className="text-xs text-[var(--color-text-tertiary)]">30-day total</p>
            <p className="text-sm font-medium text-[var(--color-accent)]">{formatCost(totalCost)}</p>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden border border-[var(--color-border)]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[var(--color-bg)] border-b border-[var(--color-border)]">
              <th className="text-left px-4 py-2.5 text-[var(--color-text-tertiary)] font-medium uppercase tracking-wide">
                Service
              </th>
              <th className="text-right px-4 py-2.5 text-[var(--color-text-tertiary)] font-medium uppercase tracking-wide">
                Resources
              </th>
              {hasCosts && (
                <th className="text-right px-4 py-2.5 text-[var(--color-text-tertiary)] font-medium uppercase tracking-wide">
                  Cost (30d)
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, i) => (
              <tr
                key={row.service}
                className={`border-b border-[var(--color-border)] last:border-0 ${
                  i % 2 === 0 ? 'bg-[var(--color-surface)]' : 'bg-[var(--color-bg)]'
                }`}
              >
                <td className="px-4 py-2.5 text-[var(--color-text-secondary)]">{row.service}</td>
                <td className="px-4 py-2.5 text-right">
                  {loadState === 'loading' ? (
                    <span className="text-[var(--color-text-tertiary)]">—</span>
                  ) : (
                    <span className={`font-medium tabular-nums ${
                      row.count > 0 ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]'
                    }`}>
                      {row.count}
                    </span>
                  )}
                </td>
                {hasCosts && (
                  <td className="px-4 py-2.5 text-right tabular-nums text-[var(--color-text-secondary)]">
                    {formatCost(row.cost_30d)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[var(--color-text-tertiary)] mt-3 leading-relaxed">
        All ephemeral resources are destroyed nightly at 5:00pm ET and rebuilt from infrastructure-as-code at 8:30am ET weekdays.
        {hasCosts && ' Costs reflect the last 30 days including partial days.'}
      </p>
    </div>
  )
}
