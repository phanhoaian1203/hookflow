import { useState } from 'react'
import { Send, Code2, ChevronDown } from 'lucide-react'
import { mockProjects, mockEndpoints } from '@/lib/mockData'
import { CopyButton } from '@/components/common/CopyButton'

const defaultPayload = JSON.stringify(
  {
    event: 'payment.success',
    orderId: 'ORD-2026-001',
    amount: 350000,
    currency: 'VND',
    transactionId: 'TXN-88421',
  },
  null,
  2
)

export function SimulatorPage() {
  const [selectedProject, setSelectedProject] = useState(mockProjects[0].id)
  const [selectedEndpoint, setSelectedEndpoint] = useState(mockEndpoints[0].id)
  const [eventType, setEventType] = useState('payment.success')
  const [payload, setPayload] = useState(defaultPayload)
  const [sent, setSent] = useState(false)

  const endpoint = mockEndpoints.find(e => e.id === selectedEndpoint) ?? mockEndpoints[0]
  const filteredEndpoints = mockEndpoints.filter(e => e.projectId === selectedProject)

  const curlPreview = `curl -X POST ${endpoint.webhookUrl} \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Event: ${eventType}" \\
  -H "X-Webhook-Signature: sha256=<computed_sig>" \\
  -d '${payload.replace(/\n/g, ' ').replace(/\s+/g, ' ')}'`

  const handleSend = () => {
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ─── Header ─── */}
      <div>
        <h1 className="text-2xl font-bold text-hf-text">Webhook Simulator</h1>
        <p className="text-sm text-hf-text-sec mt-0.5">Send test webhooks without an external provider</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* ─── Left: Form ─── */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-hf-text text-sm">Configure Request</h2>

            {/* Project selector */}
            <div>
              <label className="block text-xs font-medium text-hf-text-sec mb-1.5">Project</label>
              <div className="relative">
                <select
                  value={selectedProject}
                  onChange={e => setSelectedProject(e.target.value)}
                  className="input-base pr-8 appearance-none cursor-pointer"
                >
                  {mockProjects.filter(p => p.status === 'Active').map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-hf-muted pointer-events-none" />
              </div>
            </div>

            {/* Endpoint selector */}
            <div>
              <label className="block text-xs font-medium text-hf-text-sec mb-1.5">Endpoint</label>
              <div className="relative">
                <select
                  value={selectedEndpoint}
                  onChange={e => setSelectedEndpoint(e.target.value)}
                  className="input-base pr-8 appearance-none cursor-pointer"
                >
                  {filteredEndpoints.map(ep => (
                    <option key={ep.id} value={ep.id}>{ep.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-hf-muted pointer-events-none" />
              </div>
              <div className="mt-1.5 font-mono text-[10px] text-hf-muted bg-hf-hover border border-hf-border px-2.5 py-1.5 rounded-md">
                {endpoint.webhookUrl}
              </div>
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
              <p className="text-[10px] text-hf-muted mt-1">Sent as X-Webhook-Event header</p>
            </div>

            {/* Payload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-hf-text-sec">Payload JSON</label>
                <CopyButton text={payload} />
              </div>
              <textarea
                value={payload}
                onChange={e => setPayload(e.target.value)}
                rows={10}
                className="input-base font-mono text-xs resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* Send button */}
            <button
              onClick={handleSend}
              className={`btn-primary w-full py-3 text-sm ${sent ? 'bg-hf-success hover:bg-hf-success' : ''}`}
            >
              <Send size={15} />
              {sent ? '✓ Webhook sent! Check Event Logs' : 'Send Test Webhook'}
            </button>
          </div>
        </div>

        {/* ─── Right: Previews ─── */}
        <div className="lg:col-span-2 space-y-4">
          {/* cURL preview */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-hf-text text-sm flex items-center gap-2">
                <Code2 size={14} className="text-hf-muted" /> cURL Preview
              </h2>
              <CopyButton text={curlPreview} />
            </div>
            <div className="code-block text-xs leading-relaxed whitespace-pre-wrap break-all">
              {curlPreview}
            </div>
          </div>

          {/* Result */}
          {sent && (
            <div className="card p-5 border-hf-success/20 bg-hf-success-dim animate-slide-up">
              <h2 className="font-semibold text-hf-success text-sm mb-3">✓ Request sent</h2>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-hf-muted">Status</span>
                  <span className="text-hf-success">200 OK</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-hf-muted">Response time</span>
                  <span className="text-hf-text-sec">48ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-hf-muted">Event ID</span>
                  <span className="text-hf-text-sec">evt_mock123</span>
                </div>
              </div>
              <a href="/events" className="block mt-3 text-center text-xs text-hf-accent hover:text-hf-accent-lt transition-colors">
                View in Event Logs →
              </a>
            </div>
          )}

          {/* Tips */}
          <div className="card p-5">
            <h2 className="font-semibold text-hf-text text-sm mb-3">💡 Tips</h2>
            <ul className="space-y-2 text-xs text-hf-text-sec">
              <li className="flex gap-2"><span className="text-hf-accent">•</span> The request goes directly to your endpoint URL</li>
              <li className="flex gap-2"><span className="text-hf-accent">•</span> Signature mode: Not set yet (coming in v1.1)</li>
              <li className="flex gap-2"><span className="text-hf-accent">•</span> Check Event Logs to see your event appear</li>
              <li className="flex gap-2"><span className="text-hf-accent">•</span> Copy the cURL command to test from terminal</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
