import { useState, useMemo, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  Send, Code2, ChevronDown, Loader2, Zap, AlertTriangle,
  CheckCircle2, XCircle, ExternalLink, Wand2, Copy, Check,
  Clock, Hash, Globe, FlaskConical, ArrowRight, Info
} from 'lucide-react'
import type { WebhookEndpoint } from '@/types/endpoint.types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string
  name: string
  status: string
}

interface SendResult {
  success: boolean
  status: number
  latencyMs: number
  eventId?: string
  errorMessage?: string
  rawResponse?: unknown
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_PAYLOAD = JSON.stringify(
  {
    event: 'payment.success',
    orderId: 'ORD-2026-001',
    amount: 350000,
    currency: 'VND',
    transactionId: 'TXN-88421',
    customer: {
      id: 'CUST-001',
      email: 'customer@example.com',
    },
  },
  null,
  2
)

const PROVIDER_PRESETS: Record<string, { eventType: string; payload: object }> = {
  'payment.success': {
    eventType: 'payment.success',
    payload: {
      event: 'payment.success',
      orderId: 'ORD-2026-001',
      amount: 350000,
      currency: 'VND',
      transactionId: 'TXN-88421',
    },
  },
  'push': {
    eventType: 'push',
    payload: {
      event: 'push',
      ref: 'refs/heads/main',
      repository: { name: 'hookflow', full_name: 'org/hookflow' },
      commits: [{ id: 'abc123', message: 'feat: add simulator page' }],
    },
  },
  'order.created': {
    eventType: 'order.created',
    payload: {
      event: 'order.created',
      id: 'ORDER-9001',
      total: 1200000,
      currency: 'VND',
      status: 'pending',
      items: [{ sku: 'SKU-A1', qty: 2, price: 600000 }],
    },
  },
  'user.signup': {
    eventType: 'user.signup',
    payload: {
      event: 'user.signup',
      userId: 'usr_f8ab2c',
      email: 'newuser@example.com',
      plan: 'free',
      signedUpAt: new Date().toISOString(),
    },
  },
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function isValidJson(str: string): boolean {
  if (!str.trim()) return false
  try {
    JSON.parse(str)
    return true
  } catch {
    return false
  }
}

function formatJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : label}
      className="flex items-center gap-1.5 text-xs text-hf-muted hover:text-hf-text-sec transition-colors px-2 py-1 rounded hover:bg-hf-hover"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      <span>{copied ? 'Copied!' : label}</span>
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SimulatorPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('')
  const [eventType, setEventType] = useState('payment.success')
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD)
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState<SendResult | null>(null)

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects')
      if (res.data?.success) return res.data.data.filter((p: Project) => p.status === 'Active')
      return []
    },
  })

  const { data: endpoints = [], isLoading: endpointsLoading } = useQuery<WebhookEndpoint[]>({
    queryKey: ['endpoints'],
    queryFn: async () => {
      const res = await api.get('/webhook-endpoints')
      if (res.data?.success) return res.data.data
      return []
    },
  })

  // ── Derived ────────────────────────────────────────────────────────────────
  const filteredEndpoints = useMemo(
    () => endpoints.filter(e => e.projectId === selectedProjectId && e.isActive),
    [endpoints, selectedProjectId]
  )

  const selectedEndpoint = useMemo(
    () => endpoints.find(e => e.id === selectedEndpointId),
    [endpoints, selectedEndpointId]
  )

  const jsonValid = isValidJson(payload)
  const canSend = !!selectedEndpoint && jsonValid && !isSending

  // Auto-select first project when data loads
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select first active endpoint when project changes or endpoints finish loading
  useEffect(() => {
    if (filteredEndpoints.length > 0) {
      setSelectedEndpointId(prev =>
        // Only reset if current selection is not in this project's endpoints
        filteredEndpoints.find(e => e.id === prev) ? prev : filteredEndpoints[0].id
      )
    } else {
      setSelectedEndpointId('')
    }
  }, [selectedProjectId, filteredEndpoints]) // re-run whenever filteredEndpoints array reference changes

  // ── cURL Preview ───────────────────────────────────────────────────────────
  const curlPreview = useMemo(() => {
    const url = selectedEndpoint
      ? `http://localhost:5167/api/incoming-webhooks/${selectedEndpoint.slug}`
      : 'http://localhost:5167/api/incoming-webhooks/{slug}'
    const compactPayload = payload.replace(/\s+/g, ' ').trim()
    return `curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Event: ${eventType}" \\
  -d '${compactPayload}'`
  }, [selectedEndpoint, eventType, payload])

  // ── Preset Handler ─────────────────────────────────────────────────────────
  const applyPreset = useCallback((key: string) => {
    const preset = PROVIDER_PRESETS[key]
    if (preset) {
      setEventType(preset.eventType)
      setPayload(JSON.stringify(preset.payload, null, 2))
    }
  }, [])

  // ── Send Handler ───────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!canSend || !selectedEndpoint) return
    setIsSending(true)
    setResult(null)

    const startTime = performance.now()
    try {
      const res = await api.post(
        `/incoming-webhooks/${selectedEndpoint.slug}`,
        JSON.parse(payload),
        {
          headers: {
            'X-Webhook-Event': eventType,
            'X-Webhook-Id': `sim-${Date.now()}`,
          },
        }
      )
      const latencyMs = Math.round(performance.now() - startTime)
      setResult({
        success: true,
        status: res.status,
        latencyMs,
        eventId: res.data?.data?.eventId,
        rawResponse: res.data,
      })
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime)
      setResult({
        success: false,
        status: err.response?.status ?? 0,
        latencyMs,
        errorMessage: err.response?.data?.message ?? err.message ?? 'Network error',
        rawResponse: err.response?.data,
      })
    } finally {
      setIsSending(false)
    }
  }, [canSend, selectedEndpoint, payload, eventType])

  // ── Render ─────────────────────────────────────────────────────────────────
  const isLoading = projectsLoading || endpointsLoading

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-glow-sm">
              <FlaskConical size={16} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-hf-text">Webhook Simulator</h1>
          </div>
          <p className="text-sm text-hf-text-sec ml-10.5">
            Send test webhooks to your endpoints without an external provider
          </p>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-hf-muted">Quick presets:</span>
          {Object.keys(PROVIDER_PRESETS).map(key => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className="text-xs px-2.5 py-1 rounded-md border border-hf-border bg-hf-hover hover:border-hf-accent/40 hover:text-hf-accent text-hf-text-sec transition-all"
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* ─── Left: Form ─── */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-hf-text text-sm flex items-center gap-2">
              <Zap size={14} className="text-hf-accent" />
              Configure Request
            </h2>

            {isLoading ? (
              <div className="flex items-center gap-2 text-hf-muted text-sm py-4">
                <Loader2 size={16} className="animate-spin" />
                Loading projects and endpoints...
              </div>
            ) : projects.length === 0 ? (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-amber-300 font-medium">No active projects found</p>
                  <p className="text-hf-text-sec mt-0.5 text-xs">
                    <Link to="/projects" className="text-hf-accent hover:underline">Create a project</Link>
                    {' '}first, then add an endpoint to use the simulator.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Project selector */}
                <div>
                  <label className="block text-xs font-medium text-hf-text-sec mb-1.5">Project</label>
                  <div className="relative">
                    <select
                      value={selectedProjectId}
                      onChange={e => {
                        setSelectedProjectId(e.target.value)
                        setResult(null)
                      }}
                      className="input-base pr-8 appearance-none cursor-pointer"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-hf-muted pointer-events-none" />
                  </div>
                </div>

                {/* Endpoint selector */}
                <div>
                  <label className="block text-xs font-medium text-hf-text-sec mb-1.5">Endpoint</label>
                  {filteredEndpoints.length === 0 ? (
                    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-hf-hover border border-hf-border text-sm text-hf-text-sec">
                      <Info size={14} className="text-hf-muted flex-shrink-0" />
                      <span>
                        No active endpoints in this project.{' '}
                        <Link to="/endpoints" className="text-hf-accent hover:underline">Create one →</Link>
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <select
                          value={selectedEndpointId}
                          onChange={e => {
                            setSelectedEndpointId(e.target.value)
                            setResult(null)
                          }}
                          className="input-base pr-8 appearance-none cursor-pointer"
                        >
                          {filteredEndpoints.map(ep => (
                            <option key={ep.id} value={ep.id}>{ep.name} ({ep.provider})</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-hf-muted pointer-events-none" />
                      </div>
                      {selectedEndpoint && (
                        <div className="mt-1.5 flex items-center gap-2 font-mono text-[10px] text-hf-muted bg-hf-hover border border-hf-border px-2.5 py-1.5 rounded-md">
                          <Globe size={10} className="flex-shrink-0" />
                          <span className="truncate">
                            http://localhost:5167/api/incoming-webhooks/{selectedEndpoint.slug}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Event type */}
                <div>
                  <label className="block text-xs font-medium text-hf-text-sec mb-1.5">Event Type</label>
                  <input
                    type="text"
                    value={eventType}
                    onChange={e => setEventType(e.target.value)}
                    placeholder="e.g. payment.success"
                    className="input-base font-mono"
                  />
                  <p className="text-[10px] text-hf-muted mt-1">
                    Sent as <code className="text-hf-accent">X-Webhook-Event</code> header — backend will auto-extract this as the event type
                  </p>
                </div>

                {/* Payload editor */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-hf-text-sec">Payload JSON</label>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPayload(formatJson(payload))}
                        disabled={!jsonValid}
                        title="Format JSON"
                        className="flex items-center gap-1.5 text-xs text-hf-muted hover:text-hf-accent transition-colors px-2 py-1 rounded hover:bg-hf-hover disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Wand2 size={11} />
                        Format
                      </button>
                      <CopyBtn text={payload} label="Copy" />
                    </div>
                  </div>
                  <textarea
                    value={payload}
                    onChange={e => setPayload(e.target.value)}
                    rows={12}
                    spellCheck={false}
                    className={`input-base font-mono text-xs resize-none leading-relaxed transition-colors ${
                      payload && !jsonValid
                        ? 'border-red-500/40 focus:border-red-500/60 bg-red-500/5'
                        : ''
                    }`}
                  />
                  {payload && !jsonValid && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400">
                      <XCircle size={12} />
                      Invalid JSON syntax — please fix before sending
                    </p>
                  )}
                  {jsonValid && payload && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-400">
                      <CheckCircle2 size={12} />
                      Valid JSON
                    </p>
                  )}
                </div>

                {/* Send button */}
                <button
                  id="btn-send-webhook"
                  onClick={handleSend}
                  disabled={!canSend}
                  className={`btn-primary w-full py-3 text-sm transition-all ${
                    !canSend ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSending ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Sending webhook...
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      Send Test Webhook
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ─── Right: Previews & Result ─── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Result panel */}
          {result && (
            <div
              className={`card p-5 animate-slide-up ${
                result.success
                  ? 'border-emerald-500/25 bg-emerald-500/5'
                  : 'border-red-500/25 bg-red-500/5'
              }`}
            >
              <h2 className={`font-semibold text-sm mb-4 flex items-center gap-2 ${
                result.success ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {result.success
                  ? <CheckCircle2 size={15} />
                  : <XCircle size={15} />
                }
                {result.success ? 'Webhook Accepted' : 'Request Failed'}
              </h2>

              <div className="space-y-2.5 text-xs font-mono">
                {/* HTTP Status */}
                <div className="flex justify-between items-center">
                  <span className="text-hf-muted flex items-center gap-1.5">
                    <Hash size={10} />
                    HTTP Status
                  </span>
                  <span className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                    result.success
                      ? 'text-emerald-300 bg-emerald-500/15'
                      : 'text-red-300 bg-red-500/15'
                  }`}>
                    {result.status || '—'}
                  </span>
                </div>

                {/* Latency */}
                <div className="flex justify-between items-center">
                  <span className="text-hf-muted flex items-center gap-1.5">
                    <Clock size={10} />
                    Latency
                  </span>
                  <span className="text-hf-text-sec">{result.latencyMs}ms</span>
                </div>

                {/* Event ID */}
                {result.eventId && (
                  <div className="flex justify-between items-center">
                    <span className="text-hf-muted flex items-center gap-1.5">
                      <Zap size={10} />
                      Event ID
                    </span>
                    <span className="text-hf-text-sec truncate max-w-[140px]" title={result.eventId}>
                      {result.eventId.slice(0, 8)}...
                    </span>
                  </div>
                )}

                {/* Error message */}
                {result.errorMessage && (
                  <div className="mt-2 p-2.5 rounded-md bg-red-500/10 border border-red-500/20">
                    <p className="text-red-300 text-[11px] leading-relaxed">{result.errorMessage}</p>
                  </div>
                )}
              </div>

              {/* Navigation links */}
              {result.success && result.eventId && (
                <div className="mt-4 pt-3 border-t border-emerald-500/15 space-y-2">
                  <Link
                    to={`/events/${result.eventId}`}
                    className="flex items-center justify-between text-xs text-emerald-400 hover:text-emerald-300 transition-colors group"
                  >
                    <span className="flex items-center gap-1.5">
                      <ExternalLink size={12} />
                      View Event Detail
                    </span>
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link
                    to="/events"
                    className="flex items-center justify-between text-xs text-hf-muted hover:text-hf-text-sec transition-colors group"
                  >
                    <span>Browse all Event Logs</span>
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* cURL Preview */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-hf-text text-sm flex items-center gap-2">
                <Code2 size={14} className="text-hf-muted" />
                cURL Preview
              </h2>
              <CopyBtn text={curlPreview} label="Copy cURL" />
            </div>
            <pre className="code-block text-xs leading-relaxed whitespace-pre-wrap break-all select-all">
              {curlPreview}
            </pre>
          </div>

          {/* Tips */}
          <div className="card p-5">
            <h2 className="font-semibold text-hf-text text-sm mb-3 flex items-center gap-2">
              <Info size={13} className="text-hf-muted" />
              Tips
            </h2>
            <ul className="space-y-2 text-xs text-hf-text-sec">
              <li className="flex gap-2">
                <span className="text-hf-accent flex-shrink-0 mt-0.5">•</span>
                POST request is sent directly to your endpoint's public URL via the backend
              </li>
              <li className="flex gap-2">
                <span className="text-hf-accent flex-shrink-0 mt-0.5">•</span>
                The <code className="text-hf-accent text-[10px]">event</code> field in your JSON payload is also auto-detected as event type
              </li>
              <li className="flex gap-2">
                <span className="text-hf-accent flex-shrink-0 mt-0.5">•</span>
                Use the <strong className="text-hf-text-sec">Format</strong> button to prettify your JSON before sending
              </li>
              <li className="flex gap-2">
                <span className="text-hf-accent flex-shrink-0 mt-0.5">•</span>
                Copy the cURL command to test directly from your terminal
              </li>
              <li className="flex gap-2">
                <span className="text-violet-400 flex-shrink-0 mt-0.5">•</span>
                Signature verification coming in a future version
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
