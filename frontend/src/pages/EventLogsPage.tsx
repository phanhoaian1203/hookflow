import { Link } from 'react-router-dom'
import { Search, Filter, ExternalLink } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { mockEvents } from '@/lib/mockData'
import { formatRelativeTime } from '@/lib/utils'
import type { WebhookEventStatus } from '@/types/event.types'

const statusFilters: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Processed', value: 'Processed' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Retrying', value: 'Retrying' },
  { label: 'Dead', value: 'Dead' },
  { label: 'Failed', value: 'Failed' },
  { label: 'Invalid Sig', value: 'InvalidSignature' },
]

const providerBadge: Record<string, string> = {
  GitHub: 'bg-gray-500/15 text-gray-300',
  GenericHmac: 'bg-violet-500/15 text-violet-300',
  Payment: 'bg-emerald-500/15 text-emerald-300',
  CiCd: 'bg-blue-500/15 text-blue-300',
  Generic: 'bg-hf-hover text-hf-muted',
  Internal: 'bg-hf-hover text-hf-muted',
}

export function EventLogsPage() {
  const events = mockEvents

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-hf-text">Event Logs</h1>
          <p className="text-sm text-hf-text-sec mt-0.5">{events.length} events found</p>
        </div>
      </div>

      {/* ─── Filters ─── */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-hf-muted" />
          <input
            type="text"
            placeholder="Search by event type, ID…"
            className="input-base pl-9 h-9"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 bg-hf-bg rounded-lg p-1 border border-hf-border">
          {statusFilters.slice(0, 5).map((f) => (
            <button
              key={f.value}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                f.value === 'all'
                  ? 'bg-hf-accent text-white shadow-glow-sm'
                  : 'text-hf-text-sec hover:text-hf-text hover:bg-hf-hover'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button className="btn-secondary h-9 px-3 text-xs gap-1.5">
          <Filter size={13} /> More filters
        </button>
      </div>

      {/* ─── Table ─── */}
      <div className="card overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_1fr_140px_100px_100px_80px] gap-4 px-5 py-3 border-b border-hf-border bg-hf-bg-sec">
          {['Event Type', 'Endpoint', 'Status', 'Received', 'Retry', 'Actions'].map((h) => (
            <div key={h} className="text-xs font-semibold text-hf-muted uppercase tracking-wide">{h}</div>
          ))}
        </div>

        {/* Table rows */}
        <div className="divide-y divide-hf-border">
          {events.map((event) => (
            <Link key={event.id} to={`/events/${event.id}`} className="block">
              <div className="grid grid-cols-[1fr_1fr_140px_100px_100px_80px] gap-4 px-5 py-4 items-center table-row">
                {/* Event Type */}
                <div>
                  <div className="font-mono text-sm text-hf-text-sec">{event.eventType}</div>
                  <div className="text-[10px] text-hf-muted mt-0.5 font-mono">#{event.id.slice(0, 8)}</div>
                </div>

                {/* Endpoint */}
                <div>
                  <div className="text-sm text-hf-text truncate">{event.endpointName}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`badge text-[10px] px-1.5 py-0 ${providerBadge[event.provider] ?? providerBadge.Generic}`}>
                      {event.provider}
                    </span>
                    <span className="text-[10px] text-hf-muted">{event.projectName}</span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex flex-col gap-1">
                  <StatusBadge status={event.status} />
                  {event.signatureValid !== null && (
                    <span className={`text-[10px] ${event.signatureValid ? 'text-hf-success' : 'text-hf-danger'}`}>
                      {event.signatureValid ? '✓ Sig valid' : '✗ Sig invalid'}
                    </span>
                  )}
                </div>

                {/* Received */}
                <div className="text-xs text-hf-text-sec">{formatRelativeTime(event.receivedAt)}</div>

                {/* Retry */}
                <div>
                  {event.retryCount > 0 ? (
                    <span className="text-xs text-hf-warning">{event.retryCount}× retried</span>
                  ) : (
                    <span className="text-xs text-hf-muted">—</span>
                  )}
                </div>

                {/* Actions */}
                <div>
                  <button className="p-1.5 rounded-md text-hf-muted hover:text-hf-accent hover:bg-hf-accent-dim transition-all">
                    <ExternalLink size={13} />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-hf-border bg-hf-bg-sec">
          <span className="text-xs text-hf-muted">Showing 1–{events.length} of {events.length} events</span>
          <div className="flex gap-1">
            <button className="px-3 py-1.5 text-xs rounded-md border border-hf-border text-hf-muted hover:text-hf-text hover:bg-hf-hover disabled:opacity-40 transition-all" disabled>
              Previous
            </button>
            <button className="px-3 py-1.5 text-xs rounded-md border border-hf-border text-hf-muted hover:text-hf-text hover:bg-hf-hover disabled:opacity-40 transition-all" disabled>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
