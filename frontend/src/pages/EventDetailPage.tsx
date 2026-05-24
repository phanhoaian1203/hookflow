import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { 
  ArrowLeft, Clock, Server, Globe, CheckCircle, 
  XCircle, Loader2, FileJson, Layers, Clipboard, Check,
  AlertCircle, ShieldAlert
} from 'lucide-react'
import { StatusBadge } from '@/components/common/StatusBadge'
import { formatDate, formatRelativeTime, formatMs } from '@/lib/utils'
import type { WebhookEvent } from '@/types/event.types'

type Tab = 'payload' | 'headers' | 'attempts'

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('payload')
  const [copied, setCopied] = useState(false)

  // 1. Fetch webhook event details from real API
  const { data: event, isLoading, error } = useQuery<WebhookEvent>({
    queryKey: ['event', id],
    queryFn: async () => {
      const response = await api.get(`/webhook-events/${id}`)
      if (response.data && response.data.success) {
        return response.data.data
      }
      throw new Error(response.data.message || 'Failed to load event details')
    },
    enabled: !!id,
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-hf-accent" />
          <span className="text-hf-text-sec text-sm">Loading event logs details...</span>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex flex-col items-center gap-4 text-center">
          <AlertCircle size={40} className="text-red-400" />
          <h2 className="text-lg font-bold text-hf-text">Error Loading Event</h2>
          <p className="text-hf-text-sec text-sm max-w-md">
            {error instanceof Error ? error.message : 'The event log you are looking for does not exist or you do not have permission.'}
          </p>
          <Link to="/events" className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Event Logs
          </Link>
        </div>
      </div>
    )
  }

  // 2. Parse payload and headers JSON
  let parsedPayload: Record<string, unknown> = {}
  try {
    if (typeof event.payloadJson === 'string') {
      parsedPayload = JSON.parse(event.payloadJson)
    } else if (event.payloadJson) {
      parsedPayload = event.payloadJson
    }
  } catch (e) {
    console.error('Failed to parse payload JSON', e)
  }

  let parsedHeaders: Record<string, string> = {}
  try {
    if (typeof event.headersJson === 'string') {
      parsedHeaders = JSON.parse(event.headersJson)
    } else if (event.headersJson) {
      parsedHeaders = event.headersJson
    }
  } catch (e) {
    console.error('Failed to parse headers JSON', e)
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'payload',  label: 'Payload JSON' },
    { id: 'headers',  label: 'Headers' },
    { id: 'attempts', label: `Processing Attempts (${event.processingAttempts?.length ?? 0})` },
  ]

  // Dynamic syntax highlighter for raw JSON
  const HighlightedJson = ({ json }: { json: object }) => {
    const jsonStr = JSON.stringify(json, null, 2)
    return (
      <pre className="text-xs leading-relaxed font-mono">
        {jsonStr.split('\n').map((line, i) => {
          const keyMatch = line.match(/^(\s*)("[\w\-]+"):(.+)$/)
          if (keyMatch) {
            const key = keyMatch[2]
            const val = keyMatch[3]
            
            let valElement = <span className="text-hf-text-sec">{val}</span>
            const trimmedVal = val.trim()
            if (trimmedVal.startsWith('"')) {
              valElement = <span className="text-amber-300">{val}</span>
            } else if (trimmedVal === 'true' || trimmedVal === 'false' || trimmedVal === 'true,' || trimmedVal === 'false,') {
              valElement = <span className="text-purple-400 font-semibold">{val}</span>
            } else if (!isNaN(Number(trimmedVal.replace(/,$/, '')))) {
              valElement = <span className="text-blue-400 font-semibold">{val}</span>
            } else if (trimmedVal.startsWith('null')) {
              valElement = <span className="text-hf-muted font-medium">{val}</span>
            }

            return (
              <div key={i} className="flex flex-wrap items-center">
                <span>{keyMatch[1]}</span>
                <span className="text-blue-400 font-medium">{key}</span>
                <span className="text-hf-text-sec">:</span>
                {valElement}
              </div>
            )
          }
          return <div key={i} className="text-hf-text-sec">{line}</div>
        })}
      </pre>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ─── Breadcrumb + Header ─── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link to="/events" className="inline-flex items-center gap-1.5 text-sm text-hf-text-sec hover:text-hf-text transition-colors mb-3 font-semibold">
            <ArrowLeft size={14} /> Back to Event Logs
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-hf-text font-mono truncate max-w-md select-all" title={event.id}>
              Event: {event.id}
            </h1>
            <StatusBadge status={event.status} />
          </div>
          <p className="text-xs text-hf-muted mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span>Received {formatRelativeTime(event.receivedAt)}</span>
            <span>•</span>
            <span className="text-hf-text-sec font-semibold">{event.endpointName}</span>
            <span>•</span>
            <span>{event.projectName}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ─── Left Panel: Metadata ─── */}
        <div className="space-y-4">
          {/* Metadata Card */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-hf-text text-sm flex items-center gap-2 pb-2.5 border-b border-hf-border">
              <Layers size={14} className="text-hf-accent" />
              Event Metadata
            </h2>
            
            <div className="space-y-3.5 text-xs">
              {[
                { label: 'Event Type', value: <span className="font-mono font-semibold text-hf-accent-lt">{event.eventType}</span> },
                { label: 'External Event ID', value: <span className="font-mono text-hf-text-sec select-all">{event.externalEventId || '—'}</span> },
                { label: 'Delivery Status', value: <StatusBadge status={event.status} /> },
                { label: 'Endpoint', value: <span className="text-hf-text-sec font-medium">{event.endpointName}</span> },
                { label: 'Project Name', value: <span className="text-hf-text-sec font-medium">{event.projectName}</span> },
                {
                  label: 'Signature check',
                  value: event.signatureValid === null
                    ? <span className="text-hf-muted">Not evaluated</span>
                    : event.signatureValid
                      ? <span className="text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle size={12} /> Valid signature</span>
                      : <span className="text-red-400 font-semibold flex items-center gap-1"><XCircle size={12} /> Invalid signature</span>
                },
                { label: 'Retry Attempt Count', value: <span className={event.retryCount > 0 ? 'text-amber-400 font-bold' : 'text-hf-muted'}>{event.retryCount}</span> },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start py-0.5">
                  <span className="text-hf-muted font-semibold text-[11px] uppercase tracking-wider">{label}</span>
                  <div className="text-right pl-2 max-w-[65%] truncate">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Timing details Card */}
          <div className="card p-5 space-y-3.5">
            <h2 className="font-semibold text-hf-text text-sm flex items-center gap-2 pb-2.5 border-b border-hf-border">
              <Clock size={14} className="text-hf-accent" /> Timing Details
            </h2>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-hf-muted font-semibold text-[10px] uppercase tracking-wider">Received At</span>
                <span className="text-hf-text-sec font-medium">{formatDate(event.receivedAt)}</span>
              </div>
              {event.processedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-hf-muted font-semibold text-[10px] uppercase tracking-wider">Processed At</span>
                  <span className="text-hf-text-sec font-medium">{formatDate(event.processedAt)}</span>
                </div>
              )}
              {event.nextRetryAt && (
                <div className="flex justify-between items-center">
                  <span className="text-hf-muted font-semibold text-[10px] uppercase tracking-wider">Next Delivery Retry</span>
                  <span className="text-amber-400 font-semibold">{formatDate(event.nextRetryAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Network Source Card */}
          <div className="card p-5">
            <h2 className="font-semibold text-hf-text text-sm flex items-center gap-2 mb-3.5 pb-2.5 border-b border-hf-border">
              <Globe size={14} className="text-hf-accent" /> Network Source IP
            </h2>
            <div className="text-xs text-hf-text-sec font-mono bg-hf-bg px-2.5 py-1.5 rounded-lg border border-hf-border select-all w-fit">
              {event.sourceIp ?? '127.0.0.1'}
            </div>
          </div>

          {/* Error Message Card */}
          {event.errorMessage && (
            <div className="card p-5 border-red-500/20 bg-red-500/5 space-y-2">
              <h2 className="font-semibold text-red-400 text-sm flex items-center gap-2">
                <ShieldAlert size={14} /> Error Details
              </h2>
              <p className="text-xs text-red-400/80 font-mono leading-relaxed bg-hf-bg p-3 rounded-lg border border-red-500/10 break-all select-all">
                {event.errorMessage}
              </p>
            </div>
          )}
        </div>

        {/* ─── Right Panel: Interactive Tabs ─── */}
        <div className="lg:col-span-2 card overflow-hidden flex flex-col min-h-[500px]">
          {/* Tab bar */}
          <div className="flex border-b border-hf-border bg-hf-bg-sec">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px ${
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
          <div className="p-5 flex-1 flex flex-col bg-hf-card/25">
            
            {/* PAYLOAD TAB */}
            {activeTab === 'payload' && (
              <div className="flex-1 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-hf-text-sec uppercase tracking-wider flex items-center gap-1">
                    <FileJson size={12} className="text-hf-accent" />
                    application/json payload
                  </span>
                  
                  <button 
                    onClick={() => copyToClipboard(JSON.stringify(parsedPayload, null, 2))}
                    className="btn-secondary py-1 px-2.5 text-[11px] gap-1 h-7 border-hf-border/60 hover:bg-hf-hover/60"
                  >
                    {copied ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <Check size={12} /> Copied
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Clipboard size={12} /> Copy Raw JSON
                      </span>
                    )}
                  </button>
                </div>
                
                <div className="code-block flex-1 overflow-auto max-h-[500px] border border-hf-border/80 bg-[#06060c] p-4 rounded-xl accent-glow relative">
                  {Object.keys(parsedPayload).length > 0 ? (
                    <HighlightedJson json={parsedPayload} />
                  ) : (
                    <div className="text-hf-muted text-xs font-mono">{"{}"}</div>
                  )}
                </div>
              </div>
            )}

            {/* HEADERS TAB */}
            {activeTab === 'headers' && (
              <div className="space-y-4">
                <div className="text-[10px] font-bold text-hf-text-sec uppercase tracking-wider">
                  HTTP Request Headers
                </div>
                
                <div className="border border-hf-border rounded-xl overflow-hidden">
                  <div className="grid grid-cols-[180px_1fr] px-4 py-2 border-b border-hf-border bg-hf-bg-sec text-[10px] font-bold text-hf-muted uppercase tracking-wider">
                    <div>Header Key</div>
                    <div>Value</div>
                  </div>
                  
                  <div className="divide-y divide-hf-border bg-hf-bg/10 font-mono text-xs max-h-[500px] overflow-y-auto">
                    {Object.keys(parsedHeaders).length === 0 ? (
                      <div className="text-center py-6 text-hf-muted">No request headers logged.</div>
                    ) : (
                      Object.entries(parsedHeaders).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-[180px_1fr] px-4 py-3 gap-3 items-start select-all hover:bg-hf-hover/20">
                          <div className="text-blue-400 font-semibold break-all">{key}</div>
                          <div className="text-hf-text-sec break-all">{value}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PROCESSING ATTEMPTS TAB */}
            {activeTab === 'attempts' && (
              <div className="space-y-4">
                <div className="text-[10px] font-bold text-hf-text-sec uppercase tracking-wider">
                  Webhook Processing Attempts
                </div>
                
                <div className="text-center py-16 border border-dashed border-hf-border rounded-xl bg-hf-bg/5 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-hf-hover border border-hf-border flex items-center justify-center mx-auto text-hf-muted">
                    <Server size={18} />
                  </div>
                  <h4 className="text-xs font-semibold text-hf-text">No delivery attempts yet</h4>
                  <p className="text-[11px] text-hf-muted max-w-sm mx-auto leading-relaxed">
                    This event is currently in the **Pending** queue. Once the asynchronous worker processes it, retry history and delivery diagnostics will appear here.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
