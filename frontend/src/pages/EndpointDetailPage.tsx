import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { 
  Webhook, Calendar, Clock, ArrowLeft, Loader2, 
  Copy, Check, Edit2, RotateCw, AlertTriangle, 
  Settings2, Activity, ShieldAlert, Sparkles, X, 
  Folder, RefreshCw, KeyRound, AlertCircle, ShieldCheck
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import type { WebhookEndpoint, UpdateEndpointRequest } from '@/types/endpoint.types'

const providerColor: Record<string, string> = {
  Generic: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  GitHub: 'text-zinc-300 bg-zinc-500/10 border-zinc-500/20',
  GenericHmac: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Payment: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  CiCd: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  Internal: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
}

export function EndpointDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  // UI state
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isRotateOpen, setIsRotateOpen] = useState(false)
  
  // Rotating secret result screen state (visible ONCE)
  const [newSecretKey, setNewSecretKey] = useState<string | null>(null)

  // Form edit states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [allowedEventTypesStr, setAllowedEventTypesStr] = useState('')
  const [signatureHeaderName, setSignatureHeaderName] = useState('')
  const [rejectInvalidSignature, setRejectInvalidSignature] = useState(false)
  const [maxRetryAttempts, setMaxRetryAttempts] = useState(5)
  const [retryStrategy, setRetryStrategy] = useState('ExponentialBackoff')
  const [error, setError] = useState<string | null>(null)

  // 1. Fetch endpoint details
  const { data: endpoint, isLoading, error: fetchError } = useQuery<WebhookEndpoint>({
    queryKey: ['endpoint', id],
    queryFn: async () => {
      const response = await api.get(`/webhook-endpoints/${id}`)
      if (response.data && response.data.success) {
        const data = response.data.data
        // pre-fill form fields
        setName(data.name)
        setDescription(data.description || '')
        setAllowedEventTypesStr(data.allowedEventTypes?.join(', ') || '*')
        setSignatureHeaderName(data.signatureHeaderName)
        setRejectInvalidSignature(data.rejectInvalidSignature)
        setMaxRetryAttempts(data.maxRetryAttempts)
        setRetryStrategy(data.retryStrategy)
        return data
      }
      throw new Error(response.data.message || 'Failed to fetch endpoint details')
    },
    enabled: !!id
  })

  // 2. Mutations
  const editMutation = useMutation({
    mutationFn: async (payload: UpdateEndpointRequest) => {
      const response = await api.put(`/webhook-endpoints/${id}`, payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['endpoint', id] })
      queryClient.invalidateQueries({ queryKey: ['endpoints'] })
      setIsEditOpen(false)
      setError(null)
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Failed to update endpoint')
    }
  })

  const toggleMutation = useMutation({
    mutationFn: async () => {
      const response = await api.patch(`/webhook-endpoints/${id}/toggle`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['endpoint', id] })
      queryClient.invalidateQueries({ queryKey: ['endpoints'] })
    }
  })

  const rotateMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/webhook-endpoints/${id}/rotate-secret`)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['endpoint', id] })
      setIsRotateOpen(false)
      if (data.success && data.data) {
        setNewSecretKey(data.data.secretKey)
      }
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Failed to rotate secret')
    }
  })

  const handleOpenEdit = () => {
    if (!endpoint) return
    setName(endpoint.name)
    setDescription(endpoint.description || '')
    setAllowedEventTypesStr(endpoint.allowedEventTypes?.join(', ') || '*')
    setSignatureHeaderName(endpoint.signatureHeaderName)
    setRejectInvalidSignature(endpoint.rejectInvalidSignature)
    setMaxRetryAttempts(endpoint.maxRetryAttempts)
    setRetryStrategy(endpoint.retryStrategy)
    setError(null)
    setIsEditOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const allowedEventTypes = allowedEventTypesStr
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)

    editMutation.mutate({
      name,
      description,
      allowedEventTypes,
      signatureHeaderName,
      rejectInvalidSignature,
      maxRetryAttempts,
      retryStrategy
    })
  }

  const handleRotateSubmit = () => {
    setError(null)
    rotateMutation.mutate()
  }

  const copyToClipboard = (text: string, clipboardId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(clipboardId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formattedDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-hf-accent" />
          <span className="text-hf-text-sec text-sm">Loading endpoint details...</span>
        </div>
      </div>
    )
  }

  if (fetchError || !endpoint) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex flex-col items-center gap-4 text-center">
          <AlertCircle size={40} className="text-red-400" />
          <h2 className="text-lg font-bold text-hf-text">Error Loading Endpoint</h2>
          <p className="text-hf-text-sec text-sm max-w-md">
            {fetchError instanceof Error ? fetchError.message : 'The webhook endpoint you are looking for does not exist or you do not have permission.'}
          </p>
          <Link to="/endpoints" className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Webhook Endpoints
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* ─── Breadcrumb & Title ─── */}
      <div className="flex items-center gap-4">
        <Link 
          to="/endpoints" 
          className="p-2 rounded-lg bg-hf-card hover:bg-hf-hover border border-hf-border text-hf-text-sec hover:text-hf-text transition-all"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <div className="text-xs text-hf-muted font-medium flex items-center gap-1.5 mb-0.5">
            <Link to="/endpoints" className="hover:text-hf-accent">Endpoints</Link>
            <span>/</span>
            <span className="text-hf-text-sec">Details</span>
          </div>
          <h1 className="text-2xl font-bold text-hf-text flex items-center gap-2.5">
            <Webhook size={24} className="text-hf-accent" />
            {endpoint.name}
          </h1>
        </div>
      </div>

      {/* ─── Main Details Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: General Configuration & URL */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: URL and description */}
          <div className="gradient-border rounded-2xl bg-hf-card p-6 space-y-5 shadow-card">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <h3 className="text-xs font-semibold text-hf-muted uppercase tracking-wider">Webhook Url</h3>
                <span className={`badge text-[10px] border px-2 py-0.5 ${
                  endpoint.isActive 
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                    : 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20'
                }`}>
                  {endpoint.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs text-hf-muted mb-2 leading-relaxed">
                Add this destination URL to your webhook provider panel so they can send JSON requests to HookFlow.
              </p>
              
              <div className="p-3.5 rounded-xl bg-hf-bg border border-hf-border flex items-center justify-between gap-3 text-sm font-mono text-hf-accent-lt">
                <span className="truncate select-all">{endpoint.webhookUrl}</span>
                <button 
                  onClick={() => copyToClipboard(endpoint.webhookUrl, 'url')}
                  className="p-2 rounded-lg bg-hf-hover text-hf-muted hover:text-hf-text border border-hf-border/40 transition-colors flex-shrink-0"
                  title="Copy Webhook URL"
                >
                  {copiedId === 'url' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-hf-muted uppercase tracking-wider mb-2">Description</h3>
              <p className="text-hf-text-sec text-sm leading-relaxed">
                {endpoint.description || 'No description provided for this webhook endpoint.'}
              </p>
            </div>

            <div className="border-t border-hf-border/50 pt-5 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2.5 text-xs text-hf-text-sec">
                <Calendar size={14} className="text-hf-muted" />
                <div>
                  <span className="text-hf-muted block">Created At</span>
                  <span className="font-medium text-hf-text">{formattedDate(endpoint.createdAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-hf-text-sec">
                <Clock size={14} className="text-hf-muted" />
                <div>
                  <span className="text-hf-muted block">Last Updated</span>
                  <span className="font-medium text-hf-text">{formattedDate(endpoint.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Delivery Settings & Advanced Config */}
          <div className="gradient-border rounded-2xl bg-hf-card p-6 space-y-4 shadow-card">
            <h2 className="text-sm font-bold text-hf-text flex items-center gap-2">
              <Settings2 size={16} className="text-hf-accent" />
              Delivery & Payload Verification Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="p-4 rounded-xl bg-hf-bg border border-hf-border flex flex-col justify-between min-h-24">
                <span className="text-xs text-hf-muted uppercase font-semibold">Max Retry Attempts</span>
                <span className="text-2xl font-bold text-hf-text my-1.5">{endpoint.maxRetryAttempts}</span>
                <span className="text-[10px] text-hf-muted">Number of times HookFlow will try resending a failed event.</span>
              </div>

              <div className="p-4 rounded-xl bg-hf-bg border border-hf-border flex flex-col justify-between min-h-24">
                <span className="text-xs text-hf-muted uppercase font-semibold">Retry Strategy</span>
                <span className="text-sm font-bold text-hf-accent-lt my-1.5">
                  {endpoint.retryStrategy === 'ExponentialBackoff' ? 'Exponential Backoff ⚡' : 
                   endpoint.retryStrategy === 'LinearBackoff' ? 'Linear Backoff 📈' : 'No Retry'}
                </span>
                <span className="text-[10px] text-hf-muted">Delays between retry attempts.</span>
              </div>

              <div className="p-4 rounded-xl bg-hf-bg border border-hf-border flex flex-col justify-between min-h-24">
                <span className="text-xs text-hf-muted uppercase font-semibold">Signature Verification Header</span>
                <span className="text-xs font-mono font-semibold text-hf-text my-2 select-all bg-hf-card-sec px-2 py-1 rounded border border-hf-border w-fit">{endpoint.signatureHeaderName}</span>
                <span className="text-[10px] text-hf-muted">Header where the webhook signature hash is sent.</span>
              </div>

              <div className="p-4 rounded-xl bg-hf-bg border border-hf-border flex flex-col justify-between min-h-24">
                <span className="text-xs text-hf-muted uppercase font-semibold">Signature Validation Enforcement</span>
                <span className={`text-xs font-semibold my-2 px-2.5 py-0.5 rounded border w-fit ${
                  endpoint.rejectInvalidSignature 
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' 
                    : 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
                }`}>
                  {endpoint.rejectInvalidSignature ? 'Reject Invalid Signatures' : 'Log Signature Failures'}
                </span>
                <span className="text-[10px] text-hf-muted">Controls whether invalid payloads are dropped immediately.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Status & Security Actions */}
        <div className="space-y-6">
          
          {/* Card: Quick Actions */}
          <div className="gradient-border rounded-2xl bg-hf-card p-6 space-y-6 shadow-card">
            
            {/* Status overview */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-hf-muted uppercase tracking-wider mb-2">Endpoint Status</h3>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    endpoint.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      endpoint.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-400'
                    }`} />
                    {endpoint.isActive ? 'Active' : 'Inactive'}
                  </span>
                  
                  {/* Toggle button */}
                  <button 
                    onClick={() => toggleMutation.mutate()}
                    className={`btn text-xs px-3 py-1 border transition-all ${
                      endpoint.isActive
                        ? 'btn-danger'
                        : 'btn-secondary text-emerald-400 hover:text-emerald-300'
                    }`}
                  >
                    {endpoint.isActive ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>

              <div className="border-t border-hf-border/50 pt-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-hf-text-sec">
                  <span className="flex items-center gap-1">
                    <Folder size={12} className="text-hf-muted" /> Project:
                  </span>
                  <span className="font-semibold text-hf-text">{endpoint.projectName}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-hf-text-sec">
                  <span className="flex items-center gap-1">
                    <KeyRound size={12} className="text-hf-muted" /> Provider:
                  </span>
                  <span className={`badge text-[10px] border px-2 py-0.5 ${providerColor[endpoint.provider]}`}>{endpoint.provider}</span>
                </div>
              </div>
            </div>

            {/* Config & Security actions */}
            <div className="border-t border-hf-border/50 pt-4 space-y-2.5">
              <button 
                onClick={handleOpenEdit} 
                className="btn-secondary w-full py-2.5 text-xs flex items-center justify-center gap-1.5"
              >
                <Edit2 size={13} /> Edit Configuration
              </button>

              <button 
                onClick={() => setIsRotateOpen(true)}
                className="btn w-full bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 active:scale-[0.98] py-2.5 text-xs flex items-center justify-center gap-1.5"
              >
                <RotateCw size={13} /> Rotate Secret Key
              </button>
            </div>
          </div>

          {/* Card: Allowed Event Types Info */}
          <div className="gradient-border rounded-2xl bg-hf-card p-6 space-y-4 shadow-card">
            <h3 className="text-xs font-semibold text-hf-text flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck size={14} className="text-hf-accent" />
              Allowed Webhook Events
            </h3>
            
            <p className="text-xs text-hf-muted leading-relaxed">
              Only incoming payloads matching these event types will be accepted and logged for processing.
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {endpoint.allowedEventTypes && endpoint.allowedEventTypes.length > 0 ? (
                endpoint.allowedEventTypes.map((t, idx) => (
                  <span key={idx} className="bg-hf-card-sec border border-hf-border rounded px-2.5 py-0.5 text-xs font-mono text-hf-accent-lt">
                    {t}
                  </span>
                ))
              ) : (
                <span className="bg-hf-card-sec border border-hf-border rounded px-2.5 py-0.5 text-xs font-mono text-hf-text-sec">
                  All Events Allowed (*)
                </span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ─── EDIT MODAL ─── */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-[#020204]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-lg gradient-border rounded-2xl bg-hf-card p-6 shadow-2xl space-y-4 my-8 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-hf-text flex items-center gap-2">
                <Edit2 size={18} className="text-hf-accent" /> Edit Webhook Settings
              </h2>
              <button onClick={() => setIsEditOpen(false)} className="p-1 rounded-lg bg-hf-bg hover:bg-hf-hover text-hf-muted hover:text-hf-text transition-colors">
                <X size={16} />
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3">
                {error}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-hf-text-sec mb-1.5 uppercase tracking-wider">Endpoint Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Production Webhook"
                    className="input-base"
                    required
                  />
                </div>

                {/* Signature Header */}
                <div>
                  <label className="block text-xs font-semibold text-hf-text-sec mb-1.5 uppercase tracking-wider">Signature Header Name</label>
                  <input
                    type="text"
                    value={signatureHeaderName}
                    onChange={(e) => setSignatureHeaderName(e.target.value)}
                    placeholder="X-Webhook-Signature"
                    className="input-base"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-hf-text-sec mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  className="input-base min-h-16 resize-none"
                  rows={2}
                />
              </div>

              {/* Allowed Event Types */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-hf-text-sec uppercase tracking-wider">Allowed Event Types</label>
                  <span className="text-[10px] text-hf-muted">Separate with commas</span>
                </div>
                <input
                  type="text"
                  value={allowedEventTypesStr}
                  onChange={(e) => setAllowedEventTypesStr(e.target.value)}
                  placeholder="e.g. order.created, order.paid or * to allow all"
                  className="input-base"
                />
              </div>

              {/* Retry & Advanced */}
              <div className="p-3.5 rounded-xl bg-hf-card-sec border border-hf-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-hf-text flex items-center gap-1.5">
                    <Settings2 size={13} className="text-hf-accent" />
                    Delivery & Security Settings
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-hf-text-sec mb-1 uppercase tracking-wider">Max Retry Attempts</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={maxRetryAttempts}
                      onChange={(e) => setMaxRetryAttempts(parseInt(e.target.value) || 5)}
                      className="input-base py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-hf-text-sec mb-1 uppercase tracking-wider">Retry Strategy</label>
                    <select
                      value={retryStrategy}
                      onChange={(e) => setRetryStrategy(e.target.value)}
                      className="input-base py-1.5 text-xs"
                    >
                      <option value="None" className="bg-hf-card">No Retries</option>
                      <option value="LinearBackoff" className="bg-hf-card">Linear Backoff</option>
                      <option value="ExponentialBackoff" className="bg-hf-card">Exponential Backoff</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer mt-1 select-none">
                  <input
                    type="checkbox"
                    checked={rejectInvalidSignature}
                    onChange={(e) => setRejectInvalidSignature(e.target.checked)}
                    className="w-3.5 h-3.5 accent-hf-accent rounded border-hf-border bg-hf-bg focus:ring-0 focus:ring-offset-0"
                  />
                  <div>
                    <span className="text-[11px] font-medium text-hf-text-sec">Reject invalid signatures</span>
                    <span className="block text-[9px] text-hf-muted leading-tight">Drop requests if the signature header verification fails</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsEditOpen(false)} className="btn-secondary px-4 py-2">
                  Cancel
                </button>
                <button type="submit" disabled={editMutation.isPending} className="btn-primary px-5 py-2">
                  {editMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── ROTATE SECRET WARNING MODAL ─── */}
      {isRotateOpen && (
        <div className="fixed inset-0 bg-[#020204]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md gradient-border rounded-2xl bg-hf-card p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <AlertTriangle size={18} /> Rotate Webhook Secret?
              </h2>
              <button onClick={() => setIsRotateOpen(false)} className="p-1 rounded-lg bg-hf-bg hover:bg-hf-hover text-hf-muted hover:text-hf-text transition-colors">
                <X size={16} />
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm text-hf-text-sec leading-relaxed">
                Are you sure you want to rotate the secret key for <span className="font-semibold text-hf-text">"{endpoint.name}"</span>?
              </p>
              <div className="p-3.5 bg-amber-500/5 rounded-xl border border-amber-500/10 text-[11px] text-amber-400 flex gap-2.5 items-start">
                <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
                <span>
                  The old secret key will be invalidated immediately. Any active webhooks currently configured with the old key on third-party panels will fail signature verification.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsRotateOpen(false)} className="btn-secondary px-4 py-2">
                Cancel
              </button>
              <button 
                onClick={handleRotateSubmit} 
                disabled={rotateMutation.isPending}
                className="btn bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-glow-sm shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-[0.98] px-5 py-2"
              >
                {rotateMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : 'Yes, Rotate Secret'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── NEW SECRET DISPLAY MODAL (ONCE) ─── */}
      {newSecretKey && (
        <div className="fixed inset-0 bg-[#020204]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg gradient-border rounded-2xl bg-hf-card p-6 shadow-2xl space-y-4 accent-glow animate-scale-in">
            
            <div className="flex flex-col items-center text-center gap-3 py-2">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center text-amber-400 shadow-glow animate-pulse">
                <Sparkles size={22} fill="currentColor" className="opacity-80" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-hf-text">Secret Key Rotated!</h2>
                <p className="text-xs text-hf-text-sec max-w-sm mt-1">
                  Your new secret key is ready. Please update your third-party provider's signature key configuration immediately.
                </p>
              </div>
            </div>

            {/* Secret key box */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-hf-text-sec uppercase tracking-wider">New Secret Key (wh_sk_...)</label>
              <div className="p-3 rounded-lg bg-violet-950/10 border border-violet-500/30 flex items-center justify-between gap-3 font-mono text-sm">
                <span className="text-violet-300 font-semibold select-all break-all">{newSecretKey}</span>
                <button 
                  onClick={() => copyToClipboard(newSecretKey, 'rotated-secret')}
                  className="p-1.5 rounded bg-hf-card-sec text-hf-text-sec hover:text-hf-text border border-hf-border flex-shrink-0 transition-colors"
                  title="Copy Secret Key"
                >
                  {copiedId === 'rotated-secret' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Warning alert */}
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-xl p-3.5 flex gap-2.5 items-start">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Security Warning</div>
                <p className="text-[11px] text-amber-400/80 leading-relaxed mt-0.5">
                  This new secret key is only shown **ONCE** for security reasons. HookFlow does not store this key in a recoverable raw form once you close this window. Please copy it and save it in a safe place.
                </p>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <button 
                onClick={() => setNewSecretKey(null)}
                className="btn-primary px-8 py-2.5 text-sm flex items-center gap-1.5 shadow-glow"
              >
                I have copied the new key <Check size={14} />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
