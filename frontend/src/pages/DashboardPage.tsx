import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { 
  TrendingUp, TrendingDown, Activity, Clock, Zap, 
  RefreshCw, Skull, AlertTriangle, Loader2,
  Globe, Server, Key, DollarSign, GitBranch, ArrowRight,
  ShieldCheck, ShieldAlert
} from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatRelativeTime, formatMs, formatPercent } from '@/lib/utils'
import type { WebhookEvent, DashboardSummary } from '@/types/event.types'

export function DashboardPage() {
  // 1. Fetch dashboard summary
  const { data: summary, isLoading: isLoadingSummary, error: errorSummary } = useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: async () => {
      const response = await api.get('/dashboard/summary')
      if (response.data && response.data.success) return response.data.data
      throw new Error(response.data.message || 'Failed to fetch summary')
    }
  })

  // 2. Fetch events over time (bar chart)
  const { data: chartData = [], isLoading: isLoadingChart } = useQuery<{ day: string; count: number; failed: number }[]>({
    queryKey: ['dashboard', 'events-over-time'],
    queryFn: async () => {
      const response = await api.get('/dashboard/events-over-time')
      if (response.data && response.data.success) return response.data.data
      return []
    }
  })

  // 3. Fetch status distribution breakdown
  const { data: distribution = [], isLoading: isLoadingDistribution } = useQuery<{ status: string; count: number; percentage: number }[]>({
    queryKey: ['dashboard', 'status-distribution'],
    queryFn: async () => {
      const response = await api.get('/dashboard/status-distribution')
      if (response.data && response.data.success) return response.data.data
      return []
    }
  })

  // 4. Fetch recent events
  const { data: recentEvents = [], isLoading: isLoadingRecent } = useQuery<WebhookEvent[]>({
    queryKey: ['dashboard', 'recent-events'],
    queryFn: async () => {
      const response = await api.get('/dashboard/recent-events?count=5')
      if (response.data && response.data.success) return response.data.data
      return []
    }
  })

  if (isLoadingSummary) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 size={32} className="animate-spin text-hf-accent" />
        <span className="text-xs text-hf-text-sec">Loading dashboard analytics...</span>
      </div>
    )
  }

  if (errorSummary || !summary) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-6 flex flex-col gap-3 items-center text-center max-w-md mx-auto mt-20">
        <AlertTriangle size={32} />
        <h3 className="font-bold text-hf-text">Failed to load analytics</h3>
        <p className="text-xs text-hf-text-sec">{errorSummary instanceof Error ? errorSummary.message : 'Unknown error'}</p>
        <button onClick={() => window.location.reload()} className="btn-primary py-1.5 px-3 text-xs mt-2">
          Retry
        </button>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Events',
      value: summary.totalEvents.toLocaleString(),
      sub: `+${summary.eventsToday} today`,
      icon: Activity,
      trend: 'neutral',
      color: 'text-hf-text',
      iconBg: 'bg-hf-hover',
    },
    {
      label: 'Processed',
      value: summary.processedEvents.toLocaleString(),
      sub: `${formatPercent((summary.totalEvents - (summary.failedEvents + summary.deadEvents)) / Math.max(summary.totalEvents, 1))} success rate`,
      icon: Zap,
      trend: 'up',
      color: 'text-hf-success',
      iconBg: 'bg-hf-success-dim',
    },
    {
      label: 'Failed',
      value: summary.failedEvents.toLocaleString(),
      sub: `${summary.failureRate}% failure rate`,
      icon: AlertTriangle,
      trend: 'down',
      color: 'text-hf-danger',
      iconBg: 'bg-hf-danger-dim',
    },
    {
      label: 'Retrying',
      value: summary.retryingEvents.toLocaleString(),
      sub: 'Waiting to retry',
      icon: RefreshCw,
      trend: 'neutral',
      color: 'text-hf-warning',
      iconBg: 'bg-hf-warning-dim',
    },
    {
      label: 'Dead Events',
      value: summary.deadEvents.toLocaleString(),
      sub: 'Need manual review',
      icon: Skull,
      trend: 'neutral',
      color: 'text-hf-muted',
      iconBg: 'bg-hf-hover',
    },
    {
      label: 'Avg Response',
      value: formatMs(summary.avgProcessingTimeMs),
      sub: 'Processing time',
      icon: Clock,
      trend: 'neutral',
      color: 'text-hf-info',
      iconBg: 'bg-hf-info-dim',
    },
  ]

  const maxCount = Math.max(...chartData.map(d => d.count), 1)

  const statusColor: Record<string, string> = {
    Processed: 'bg-hf-success',
    Failed: 'bg-hf-danger',
    Retrying: 'bg-hf-warning',
    Dead: 'bg-hf-muted',
    Pending: 'bg-hf-info',
    Ignored: 'bg-violet-500/60',
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'GitHub':
        return { Icon: Globe, bg: 'bg-[#171515]/30 border-[#171515]/20 text-hf-text', label: 'GitHub' }
      case 'Payment':
        return { Icon: DollarSign, bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', label: 'Payment' }
      case 'CiCd':
        return { Icon: GitBranch, bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400', label: 'CI/CD' }
      case 'GenericHmac':
        return { Icon: Key, bg: 'bg-violet-500/10 border-violet-500/20 text-violet-400', label: 'HMAC' }
      case 'Internal':
        return { Icon: Server, bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400', label: 'Internal' }
      default:
        return { Icon: Globe, bg: 'bg-hf-hover border-hf-border text-hf-muted', label: 'Generic' }
    }
  }

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
          {isLoadingChart ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={20} className="animate-spin text-hf-muted" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-xs text-hf-muted">
              No activity logs recorded.
            </div>
          ) : (
            <div className="flex items-end gap-3 h-32">
              {chartData.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col items-center gap-0.5" style={{ height: '100px' }}>
                    <div className="flex-1 w-full flex items-end gap-0.5">
                      <div
                        className="flex-1 bg-hf-accent/60 rounded-t-sm hover:bg-hf-accent-lt transition-colors relative group cursor-pointer"
                        style={{ height: `${(d.count / maxCount) * 100}%` }}
                        title={`${d.count} events`}
                      />
                      {d.failed > 0 && (
                        <div
                          className="w-1/3 bg-hf-danger/60 rounded-t-sm cursor-pointer"
                          style={{ height: `${(d.failed / maxCount) * 100}%` }}
                          title={`${d.failed} failed/dead`}
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-hf-muted">{d.day}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Status Distribution ─── */}
        <div className="card p-5">
          <h2 className="font-semibold text-hf-text mb-4">Status breakdown</h2>
          {isLoadingDistribution ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 size={20} className="animate-spin text-hf-muted" />
            </div>
          ) : distribution.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-xs text-hf-muted">
              No distribution metrics.
            </div>
          ) : (
            <div className="space-y-3">
              {distribution.map((item) => (
                <div key={item.status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-hf-text-sec">{item.status}</span>
                    <span className="text-hf-muted">{item.count.toLocaleString()} · {item.percentage}%</span>
                  </div>
                  <div className="h-1.5 bg-hf-hover rounded-full overflow-hidden">
                    <div className={`h-full ${statusColor[item.status] ?? 'bg-hf-muted'} rounded-full transition-all`} style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
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
        
        {isLoadingRecent ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-hf-muted" />
          </div>
        ) : recentEvents.length === 0 ? (
          <div className="text-center py-10 text-xs text-hf-muted">
            No recent webhook event logs found.
          </div>
        ) : (
          <div className="divide-y divide-hf-border">
            {recentEvents.map((event) => {
              const prov = getProviderIcon(event.provider)
              const ProviderIcon = prov.Icon
              
              return (
                <Link key={event.id} to={`/events/${event.id}`} className="block group">
                  <div className="flex items-center justify-between gap-4 px-5 py-4.5 hover:bg-hf-hover/20 transition-all border-b border-hf-border last:border-0 relative overflow-hidden">
                    {/* Hover glow background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-hf-accent/0 via-hf-accent/[0.02] to-hf-accent/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    <div className="flex items-center gap-4 min-w-0">
                      {/* Status & Provider Icon */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${prov.bg} transition-transform group-hover:scale-105 shadow-sm`}>
                          <ProviderIcon size={18} />
                        </div>
                        {/* Status micro dot */}
                        <div className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#0d0d17] border border-hf-border">
                          <span className={`h-2.5 w-2.5 rounded-full ${
                            event.status === 'Processed' ? 'bg-hf-success' :
                            event.status === 'Failed' || event.status === 'Dead' ? 'bg-hf-danger' :
                            event.status === 'Retrying' ? 'bg-hf-warning' :
                            'bg-hf-info'
                          }`} />
                        </div>
                      </div>

                      {/* Event details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-mono font-semibold text-hf-text group-hover:text-hf-accent-lt transition-colors truncate max-w-xs md:max-w-md">
                            {event.eventType}
                          </span>
                          
                          {/* Signature validation tag */}
                          {event.signatureValid !== null && (
                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              event.signatureValid 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>
                              {event.signatureValid ? (
                                <><ShieldCheck size={10} /> Sig Valid</>
                              ) : (
                                <><ShieldAlert size={10} /> Sig Invalid</>
                              )}
                            </span>
                          )}

                          <span className="text-[10px] text-hf-muted uppercase font-bold tracking-widest bg-hf-card px-2 py-0.5 rounded border border-hf-border/60">
                            {event.status}
                          </span>
                        </div>

                        {/* Endpoint and Project details */}
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-hf-muted flex-wrap">
                          <span className="inline-flex items-center gap-1 text-hf-text-sec">
                            <Server size={11} className="text-hf-accent" /> 
                            {event.endpointName}
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-hf-muted">{event.projectName}</span>
                          <span>•</span>
                          <span className="text-[10px] px-1.5 py-0.25 bg-hf-hover border border-hf-border rounded text-hf-muted">
                            {prov.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Time and slide-in arrow */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-xs text-hf-text-sec font-medium flex items-center gap-1 justify-end">
                          <Clock size={11} className="text-hf-muted" />
                          {formatRelativeTime(event.receivedAt)}
                        </div>
                        {event.retryCount > 0 && (
                          <span className="inline-block mt-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                            {event.retryCount} retries
                          </span>
                        )}
                      </div>
                      
                      {/* Glide right arrow */}
                      <ArrowRight 
                        size={14} 
                        className="text-hf-muted group-hover:text-hf-accent group-hover:translate-x-1.5 transition-all opacity-0 group-hover:opacity-100" 
                      />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
