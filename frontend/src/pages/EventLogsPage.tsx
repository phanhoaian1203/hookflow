import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { 
  Search, Filter, ExternalLink, Loader2, 
  Calendar, Inbox, ChevronLeft, ChevronRight, X
} from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatRelativeTime } from '@/lib/utils'
import type { WebhookEvent, WebhookEndpoint } from '@/types/event.types'

const statusFilters: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Processed', value: 'Processed' },
  { label: 'Failed', value: 'Failed' },
  { label: 'Retrying', value: 'Retrying' },
  { label: 'Dead', value: 'Dead' },
  { label: 'Ignored', value: 'Ignored' },
]

const providerBadge: Record<string, string> = {
  GitHub: 'bg-gray-500/15 text-gray-300 border-gray-500/30',
  GenericHmac: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  Payment: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  CiCd: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  Generic: 'bg-hf-hover text-hf-muted border-hf-border',
  Internal: 'bg-hf-hover text-hf-muted border-hf-border',
}

interface Project {
  id: string
  name: string
}

export function EventLogsPage() {
  // States for query filters
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [endpointId, setEndpointId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const pageSize = 15

  // 1. Fetch user projects for filtering
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects')
      if (response.data && response.data.success) {
        return response.data.data
      }
      return []
    }
  })

  // 2. Fetch user endpoints for filtering
  const { data: endpoints = [] } = useQuery<WebhookEndpoint[]>({
    queryKey: ['endpoints'],
    queryFn: async () => {
      const response = await api.get('/webhook-endpoints')
      if (response.data && response.data.success) {
        return response.data.data
      }
      return []
    }
  })

  // 3. Fetch events based on current states
  const { data: eventData, isLoading, error } = useQuery<{
    items: WebhookEvent[]
    totalItems: number
    page: number
    totalPages: number
  }>({
    queryKey: ['events', search, status, endpointId, projectId, fromDate, toDate, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('pageSize', pageSize.toString())
      if (search) params.append('search', search)
      if (status) params.append('status', status)
      if (endpointId) params.append('endpointId', endpointId)
      if (projectId) params.append('projectId', projectId)
      if (fromDate) params.append('fromDate', new Date(fromDate).toISOString())
      if (toDate) params.append('toDate', new Date(toDate).toISOString())

      const response = await api.get(`/webhook-events?${params.toString()}`)
      if (response.data && response.data.success) {
        return response.data.data
      }
      throw new Error(response.data.message || 'Failed to fetch event logs')
    }
  })

  const handleResetFilters = () => {
    setSearch('')
    setStatus('')
    setEndpointId('')
    setProjectId('')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && eventData && newPage <= eventData.totalPages) {
      setPage(newPage)
    }
  }

  const events = eventData?.items || []
  const totalItems = eventData?.totalItems || 0
  const totalPages = eventData?.totalPages || 1

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-hf-text flex items-center gap-2.5">
            Event Logs
          </h1>
          <p className="text-sm text-hf-text-sec mt-0.5">
            {isLoading ? 'Searching...' : `${totalItems} events found`}
          </p>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-hf-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by event type, external ID, payload..."
              className="input-base pl-9 h-9 text-xs"
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 bg-hf-bg rounded-lg p-1 border border-hf-border overflow-x-auto max-w-full">
            {statusFilters.slice(0, 5).map((f) => (
              <button
                key={f.value}
                onClick={() => { setStatus(f.value); setPage(1); }}
                className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                  status === f.value
                    ? 'bg-hf-accent text-white shadow-glow-sm'
                    : 'text-hf-text-sec hover:text-hf-text hover:bg-hf-hover'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Advanced toggle button */}
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`btn-secondary h-9 px-3 text-xs gap-1.5 ${showAdvanced ? 'border-hf-accent text-hf-accent' : ''}`}
          >
            <Filter size={13} /> Filters
          </button>

          {/* Reset button */}
          {(search || status || endpointId || projectId || fromDate || toDate) && (
            <button 
              onClick={handleResetFilters}
              className="btn-ghost h-9 px-2 text-xs text-hf-danger hover:bg-red-500/5 flex items-center gap-1"
            >
              <X size={13} /> Reset
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-hf-bg/40 border border-hf-border/60 animate-scale-in">
            {/* Filter by Project */}
            <div>
              <label className="block text-[10px] font-semibold text-hf-text-sec uppercase mb-1.5 tracking-wider">Project</label>
              <select
                value={projectId}
                onChange={(e) => { setProjectId(e.target.value); setPage(1); }}
                className="input-base py-1.5 text-xs h-9"
              >
                <option value="">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-hf-card">{p.name}</option>
                ))}
              </select>
            </div>

            {/* Filter by Endpoint */}
            <div>
              <label className="block text-[10px] font-semibold text-hf-text-sec uppercase mb-1.5 tracking-wider">Webhook Endpoint</label>
              <select
                value={endpointId}
                onChange={(e) => { setEndpointId(e.target.value); setPage(1); }}
                className="input-base py-1.5 text-xs h-9"
              >
                <option value="">All Endpoints</option>
                {endpoints.map((ep) => (
                  <option key={ep.id} value={ep.id} className="bg-hf-card">{ep.name}</option>
                ))}
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-[10px] font-semibold text-hf-text-sec uppercase mb-1.5 tracking-wider">From Date</label>
              <div className="relative">
                <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-hf-muted" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                  className="input-base pl-9 py-1.5 text-xs h-9 text-hf-text-sec"
                />
              </div>
            </div>

            {/* To Date */}
            <div>
              <label className="block text-[10px] font-semibold text-hf-text-sec uppercase mb-1.5 tracking-wider">To Date</label>
              <div className="relative">
                <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-hf-muted" />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                  className="input-base pl-9 py-1.5 text-xs h-9 text-hf-text-sec"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-4">
          Error loading events: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {/* ─── Table ─── */}
      <div className="card overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1.5fr_1.5fr_120px_130px_80px_60px] gap-4 px-5 py-3.5 border-b border-hf-border bg-hf-bg-sec">
          {['Event Type', 'Endpoint Context', 'Status', 'Received', 'Retry', 'View'].map((h) => (
            <div key={h} className="text-xs font-bold text-hf-muted uppercase tracking-wide">{h}</div>
          ))}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 bg-hf-card/10">
            <Loader2 size={24} className="animate-spin text-hf-accent" />
            <span className="text-hf-text-sec text-xs">Fetching logs...</span>
          </div>
        ) : events.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-10 h-10 rounded-xl bg-hf-hover border border-hf-border flex items-center justify-center text-hf-muted">
              <Inbox size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-hf-text">No webhook logs found</h3>
              <p className="text-xs text-hf-muted max-w-sm mt-0.5">
                No events matched your search filters, or no events have been received by your endpoints yet.
              </p>
            </div>
          </div>
        ) : (
          /* Table rows */
          <div className="divide-y divide-hf-border">
            {events.map((event) => (
              <Link key={event.id} to={`/events/${event.id}`} className="block">
                <div className="grid grid-cols-[1.5fr_1.5fr_120px_130px_80px_60px] gap-4 px-5 py-4 items-center table-row">
                  {/* Event Type & ID */}
                  <div className="min-w-0">
                    <div className="font-mono text-sm text-hf-accent-lt truncate" title={event.eventType}>
                      {event.eventType}
                    </div>
                    <div className="text-[10px] text-hf-muted mt-0.5 font-mono truncate">
                      ID: {event.id}
                      {event.externalEventId && ` · Ext: ${event.externalEventId}`}
                    </div>
                  </div>

                  {/* Endpoint Context */}
                  <div className="min-w-0">
                    <div className="text-sm text-hf-text font-medium truncate" title={event.endpointName}>
                      {event.endpointName}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`badge text-[9px] border px-1.5 py-0 ${providerBadge[event.provider] ?? providerBadge.Generic}`}>
                        {event.provider}
                      </span>
                      <span className="text-[10px] text-hf-muted truncate">{event.projectName}</span>
                    </div>
                  </div>

                  {/* Status & Signature badge */}
                  <div>
                    <StatusBadge status={event.status} />
                    {event.signatureValid !== null && (
                      <span className={`block text-[9px] font-medium mt-1 ${event.signatureValid ? 'text-emerald-400' : 'text-red-400'}`}>
                        {event.signatureValid ? '✓ verified' : '✗ bad signature'}
                      </span>
                    )}
                  </div>

                  {/* Received */}
                  <div className="text-xs text-hf-text-sec">
                    {formatRelativeTime(event.receivedAt)}
                  </div>

                  {/* Retry */}
                  <div className="text-xs">
                    {event.retryCount > 0 ? (
                      <span className="text-amber-400 font-semibold">{event.retryCount}×</span>
                    ) : (
                      <span className="text-hf-muted">—</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div>
                    <span className="p-1.5 rounded-lg bg-hf-bg hover:bg-hf-hover border border-hf-border text-hf-muted hover:text-hf-accent transition-colors flex w-fit">
                      <ExternalLink size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && events.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-hf-border bg-hf-bg-sec">
            <span className="text-xs text-hf-muted">
              Showing <span className="font-semibold text-hf-text-sec">{((page - 1) * pageSize) + 1}</span> to <span className="font-semibold text-hf-text-sec">{Math.min(page * pageSize, totalItems)}</span> of <span className="font-semibold text-hf-text-sec">{totalItems}</span> events
            </span>
            <div className="flex gap-1">
              <button 
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="btn-secondary h-8 px-2 text-xs gap-1 disabled:opacity-40"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="px-3 py-1.5 text-xs text-hf-text-sec font-semibold select-none border border-hf-border bg-hf-card/40 rounded-lg">
                {page} / {totalPages}
              </span>
              <button 
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="btn-secondary h-8 px-2 text-xs gap-1 disabled:opacity-40"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
