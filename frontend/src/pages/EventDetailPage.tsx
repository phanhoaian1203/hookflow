import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, RefreshCw, Clock, Server, Globe, CheckCircle, XCircle } from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { CopyButton } from '@/components/common/CopyButton'
import { mockEvents } from '@/lib/mockData'
import { formatDate, formatRelativeTime, formatMs } from '@/lib/utils'
import { useState } from 'react'

type Tab = 'payload' | 'headers' | 'attempts'

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('payload')

  const event = mockEvents.find(e => e.id === id) ?? mockEvents[0]

  const tabs: { id: Tab; label: string }[] = [
    { id: 'payload',  label: 'Payload JSON' },
    { id: 'headers',  label: 'Headers' },
    { id: 'attempts', label: `Processing (${event.processingAttempts?.length ?? 0})` },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ─── Breadcrumb + Header ─── */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/events" className="inline-flex items-center gap-1.5 text-sm text-hf-text-sec hover:text-hf-text transition-colors mb-3">
            <ArrowLeft size={14} /> Event Logs
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-hf-text font-mono">{event.id}</h1>
            <StatusBadge status={event.status} />
          </div>
          <p className="text-sm text-hf-muted mt-1">
            Received {formatRelativeTime(event.receivedAt)} · {event.endpointName} · {event.projectName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary px-4 py-2 text-sm">
            <RefreshCw size={14} /> Replay Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ─── Left: Metadata ─── */}
        <div className="space-y-4">
          {/* Event Info */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-hf-text text-sm">Event Details</h2>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Event Type', value: <span className="font-mono text-hf-accent-lt">{event.eventType}</span> },
                { label: 'Status', value: <StatusBadge status={event.status} /> },
                { label: 'Provider', value: <span className="text-hf-text-sec">{event.provider}</span> },
                { label: 'Endpoint', value: <span className="text-hf-text-sec">{event.endpointName}</span> },
                { label: 'Project', value: <span className="text-hf-text-sec">{event.projectName}</span> },
                {
                  label: 'Signature',
                  value: event.signatureValid === null
                    ? <span className="text-hf-muted">Not checked</span>
                    : event.signatureValid
                      ? <span className="text-hf-success flex items-center gap-1"><CheckCircle size={13} /> Valid</span>
                      : <span className="text-hf-danger flex items-center gap-1"><XCircle size={13} /> Invalid</span>
                },
                { label: 'Retry Count', value: <span className={event.retryCount > 0 ? 'text-hf-warning' : 'text-hf-muted'}>{event.retryCount}</span> },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-1 border-b border-hf-border last:border-0">
                  <span className="text-hf-muted text-xs">{label}</span>
                  <div className="text-right text-xs">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Timing */}
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-hf-text text-sm flex items-center gap-2">
              <Clock size={14} className="text-hf-muted" /> Timing
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-hf-border">
                <span className="text-hf-muted">Received at</span>
                <span className="text-hf-text-sec">{formatDate(event.receivedAt)}</span>
              </div>
              {event.processedAt && (
                <div className="flex justify-between py-1 border-b border-hf-border">
                  <span className="text-hf-muted">Processed at</span>
                  <span className="text-hf-text-sec">{formatDate(event.processedAt)}</span>
                </div>
              )}
              {event.durationMs && (
                <div className="flex justify-between py-1">
                  <span className="text-hf-muted">Duration</span>
                  <span className="text-hf-success">{formatMs(event.durationMs)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Source */}
          <div className="card p-5">
            <h2 className="font-semibold text-hf-text text-sm flex items-center gap-2 mb-3">
              <Globe size={14} className="text-hf-muted" /> Source
            </h2>
            <div className="text-xs text-hf-text-sec font-mono">{event.sourceIp ?? 'Unknown'}</div>
          </div>

          {/* Error */}
          {event.errorMessage && (
            <div className="card p-5 border-hf-danger/30 bg-hf-danger-dim">
              <h2 className="font-semibold text-hf-danger text-sm mb-2">Error Message</h2>
              <p className="text-xs text-hf-danger/80 font-mono leading-relaxed">{event.errorMessage}</p>
            </div>
          )}
        </div>

        {/* ─── Right: Tabs ─── */}
        <div className="lg:col-span-2 card overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-hf-border bg-hf-bg-sec">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-hf-accent text-hf-accent'
                    : 'border-transparent text-hf-text-sec hover:text-hf-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="p-5">
            {/* Payload */}
            {activeTab === 'payload' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-hf-muted">application/json</span>
                  <CopyButton text={JSON.stringify(event.payloadJson, null, 2)} />
                </div>
                <div className="code-block overflow-auto max-h-96">
                  <pre className="text-xs leading-relaxed">
                    {JSON.stringify(event.payloadJson, null, 2)
                      .split('\n')
                      .map((line, i) => {
                        const keyMatch = line.match(/^(\s*)("[\w]+"):(.+)$/)
                        if (keyMatch) {
                          return (
                            <div key={i}>
                              <span>{keyMatch[1]}</span>
                              <span className="text-blue-400">{keyMatch[2]}</span>
                              <span className="text-hf-text-sec">:</span>
                              <span className="text-amber-300">{keyMatch[3]}</span>
                            </div>
                          )
                        }
                        return <div key={i} className="text-hf-text-sec">{line}</div>
                      })}
                  </pre>
                </div>
              </div>
            )}

            {/* Headers */}
            {activeTab === 'headers' && (
              <div className="space-y-2">
                {Object.entries(event.headersJson ?? {}).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-3 py-2 border-b border-hf-border last:border-0">
                    <span className="font-mono text-xs text-blue-400 w-48 flex-shrink-0">{key}</span>
                    <span className="font-mono text-xs text-hf-text-sec break-all">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Processing Attempts */}
            {activeTab === 'attempts' && (
              <div className="space-y-3">
                {(event.processingAttempts ?? []).length === 0 ? (
                  <div className="text-center py-8 text-hf-muted text-sm">No processing attempts yet</div>
                ) : (
                  event.processingAttempts!.map((attempt) => (
                    <div
                      key={attempt.id}
                      className={`card p-4 border ${attempt.status === 'Success' ? 'border-hf-success/20 bg-hf-success-dim/30' : 'border-hf-danger/20 bg-hf-danger-dim/30'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {attempt.status === 'Success'
                            ? <CheckCircle size={14} className="text-hf-success" />
                            : <XCircle size={14} className="text-hf-danger" />
                          }
                          <span className="text-sm font-medium text-hf-text">Attempt #{attempt.attemptNumber}</span>
                          <span className={`badge text-[10px] ${attempt.status === 'Success' ? 'bg-hf-success-dim text-hf-success' : 'bg-hf-danger-dim text-hf-danger'}`}>
                            {attempt.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-hf-muted">
                          <Server size={11} />
                          <span>{attempt.workerName}</span>
                          {attempt.durationMs && (
                            <span className="text-hf-text-sec">{formatMs(attempt.durationMs)}</span>
                          )}
                        </div>
                      </div>
                      {attempt.errorMessage && (
                        <p className="text-xs font-mono text-hf-danger/80 mt-2 pl-5 border-l-2 border-hf-danger/30">
                          {attempt.errorMessage}
                        </p>
                      )}
                      <div className="text-[10px] text-hf-muted mt-2 pl-5">
                        Started: {formatDate(attempt.startedAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
