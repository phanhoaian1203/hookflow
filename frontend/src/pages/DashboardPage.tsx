import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Activity, Clock, Zap, RefreshCw, Skull, AlertTriangle } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { mockEvents, mockDashboardSummary } from '@/lib/mockData'
import { formatRelativeTime, formatMs, formatPercent } from '@/lib/utils'

const statCards = [
  {
    label: 'Total Events',
    value: '1,284',
    sub: '+87 today',
    icon: Activity,
    trend: 'up',
    color: 'text-hf-text',
    iconBg: 'bg-hf-hover',
  },
  {
    label: 'Processed',
    value: '1,198',
    sub: '93.3% success rate',
    icon: Zap,
    trend: 'up',
    color: 'text-hf-success',
    iconBg: 'bg-hf-success-dim',
  },
  {
    label: 'Failed',
    value: '48',
    sub: '3.7% failure rate',
    icon: AlertTriangle,
    trend: 'down',
    color: 'text-hf-danger',
    iconBg: 'bg-hf-danger-dim',
  },
  {
    label: 'Retrying',
    value: '23',
    sub: 'Waiting to retry',
    icon: RefreshCw,
    trend: 'neutral',
    color: 'text-hf-warning',
    iconBg: 'bg-hf-warning-dim',
  },
  {
    label: 'Dead Events',
    value: '12',
    sub: 'Need manual review',
    icon: Skull,
    trend: 'neutral',
    color: 'text-hf-muted',
    iconBg: 'bg-hf-hover',
  },
  {
    label: 'Avg Response',
    value: '234ms',
    sub: 'Processing time',
    icon: Clock,
    trend: 'up',
    color: 'text-hf-info',
    iconBg: 'bg-hf-info-dim',
  },
]

// Simple bar chart data (last 7 days)
const chartData = [
  { day: 'Mon', count: 120, failed: 5 },
  { day: 'Tue', count: 95, failed: 5 },
  { day: 'Wed', count: 142, failed: 8 },
  { day: 'Thu', count: 88, failed: 3 },
  { day: 'Fri', count: 165, failed: 12 },
  { day: 'Sat', count: 72, failed: 2 },
  { day: 'Sun', count: 87, failed: 5 },
]
const maxCount = Math.max(...chartData.map(d => d.count))

const recentEvents = mockEvents.slice(0, 5)

export function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Page Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-hf-text">Dashboard</h1>
          <p className="text-sm text-hf-text-sec mt-0.5">Overview of your webhook activity</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-hf-success bg-hf-success-dim border border-hf-success/20 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-hf-success animate-pulse" />
            System healthy
          </span>
        </div>
      </div>

      {/* ─── Stats Grid ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                <card.icon size={16} className={card.color} />
              </div>
              {card.trend === 'up' && <TrendingUp size={14} className="text-hf-success" />}
              {card.trend === 'down' && <TrendingDown size={14} className="text-hf-danger" />}
            </div>
            <div className={`text-2xl font-bold ${card.color} mb-0.5`}>{card.value}</div>
            <div className="text-[11px] text-hf-text-sec font-medium">{card.label}</div>
            <div className="text-[10px] text-hf-muted mt-0.5">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ─── Chart ─── */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-hf-text">Events over time</h2>
              <p className="text-xs text-hf-muted mt-0.5">Last 7 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-hf-text-sec">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-hf-accent inline-block" />Total</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-hf-danger/60 inline-block" />Failed</span>
            </div>
          </div>
          {/* Bar chart */}
          <div className="flex items-end gap-3 h-32">
            {chartData.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center gap-0.5" style={{ height: '100px' }}>
                  <div className="flex-1 w-full flex items-end gap-0.5">
                    <div
                      className="flex-1 bg-hf-accent/60 rounded-t-sm hover:bg-hf-accent-lt transition-colors relative group"
                      style={{ height: `${(d.count / maxCount) * 100}%` }}
                      title={`${d.count} events`}
                    />
                    <div
                      className="w-1/3 bg-hf-danger/60 rounded-t-sm"
                      style={{ height: `${(d.failed / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-[10px] text-hf-muted">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Status Distribution ─── */}
        <div className="card p-5">
          <h2 className="font-semibold text-hf-text mb-4">Status breakdown</h2>
          <div className="space-y-3">
            {[
              { label: 'Processed', count: mockDashboardSummary.processedEvents, color: 'bg-hf-success', pct: 93.3 },
              { label: 'Failed',    count: mockDashboardSummary.failedEvents,     color: 'bg-hf-danger',  pct: 3.7  },
              { label: 'Retrying',  count: mockDashboardSummary.retryingEvents,   color: 'bg-hf-warning', pct: 1.8  },
              { label: 'Dead',      count: mockDashboardSummary.deadEvents,       color: 'bg-hf-muted',   pct: 0.9  },
              { label: 'Pending',   count: mockDashboardSummary.pendingEvents,    color: 'bg-hf-info',    pct: 0.3  },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-hf-text-sec">{item.label}</span>
                  <span className="text-hf-muted">{item.count.toLocaleString()} · {item.pct}%</span>
                </div>
                <div className="h-1.5 bg-hf-hover rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Recent Events ─── */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-hf-border">
          <h2 className="font-semibold text-hf-text">Recent events</h2>
          <Link to="/events" className="text-xs text-hf-accent hover:text-hf-accent-lt transition-colors">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-hf-border">
          {recentEvents.map((event) => (
            <Link key={event.id} to={`/events/${event.id}`} className="block">
              <div className="table-row flex items-center gap-4 px-5 py-3.5">
                <StatusBadge status={event.status} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-hf-text-sec text-xs">{event.eventType}</span>
                    {event.signatureValid !== null && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${event.signatureValid ? 'bg-hf-success-dim text-hf-success' : 'bg-hf-danger-dim text-hf-danger'}`}>
                        {event.signatureValid ? 'sig ✓' : 'sig ✗'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-hf-muted mt-0.5">{event.endpointName} · {event.projectName}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-hf-muted">{formatRelativeTime(event.receivedAt)}</div>
                  {event.retryCount > 0 && (
                    <div className="text-[10px] text-hf-warning mt-0.5">{event.retryCount} retries</div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
