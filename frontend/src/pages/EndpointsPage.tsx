import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { 
  Plus, Webhook, AlertTriangle, Edit2, Trash2, 
  Loader2, X, Copy, Check, ExternalLink, Activity, 
  Settings2, Sparkles, Folder, ArrowRight, ShieldAlert
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import type { WebhookEndpoint, CreateEndpointRequest, UpdateEndpointRequest } from '@/types/endpoint.types'

interface Project {
  id: string
  name: string
  status: string
}

const providerColor: Record<string, string> = {
  Generic: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  GitHub: 'text-zinc-300 bg-zinc-500/10 border-zinc-500/20',
  GenericHmac: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Payment: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  CiCd: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  Internal: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
}

export function EndpointsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Copy states
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  
  // Created secret key modal (visible ONLY once after creation)
  const [createdSecret, setCreatedSecret] = useState<{ secretKey: string; webhookUrl: string } | null>(null)

  // Selected endpoint
  const [selectedEndpoint, setSelectedEndpoint] = useState<WebhookEndpoint | null>(null)

  // Form states
  const [projectId, setProjectId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [provider, setProvider] = useState('Generic')
  const [eventTypesStr, setEventTypesStr] = useState('*')
  const [signatureHeaderName, setSignatureHeaderName] = useState('X-Webhook-Signature')
  const [rejectInvalidSignature, setRejectInvalidSignature] = useState(false)
  const [maxRetryAttempts, setMaxRetryAttempts] = useState(5)
  const [retryStrategy, setRetryStrategy] = useState('ExponentialBackoff')
  const [error, setError] = useState<string | null>(null)

  // 1. Fetch user endpoints
  const { data: endpoints = [], isLoading, error: fetchError } = useQuery<WebhookEndpoint[]>({
    queryKey: ['endpoints'],
    queryFn: async () => {
      const response = await api.get('/webhook-endpoints')
      if (response.data && response.data.success) {
        return response.data.data
      }
      throw new Error(response.data.message || 'Failed to fetch endpoints')
    }
  })

  // 2. Fetch projects for selection
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects')
      if (response.data && response.data.success) {
        return response.data.data.filter((p: Project) => p.status === 'Active')
      }
      return []
    }
  })

  // 3. Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: CreateEndpointRequest) => {
      const response = await api.post('/webhook-endpoints', payload)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['endpoints'] })
      setIsCreateOpen(false)
      
      // Save secret response to show "Secret Created" screen
      if (data.success && data.data) {
        setCreatedSecret({
          secretKey: data.data.secretKey,
          webhookUrl: data.data.endpoint.webhookUrl
        })
      }
      resetForm()
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Failed to create endpoint')
    }
  })

  const editMutation = useMutation({
    mutationFn: async (payload: { id: string; data: UpdateEndpointRequest }) => {
      const response = await api.put(`/webhook-endpoints/${payload.id}`, payload.data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['endpoints'] })
      setIsEditOpen(false)
      resetForm()
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Failed to update endpoint')
    }
  })

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/webhook-endpoints/${id}/toggle`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['endpoints'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/webhook-endpoints/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['endpoints'] })
      setIsDeleteOpen(false)
      setSelectedEndpoint(null)
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Failed to delete endpoint')
    }
  })

  const resetForm = () => {
    setProjectId(projects[0]?.id || '')
    setName('')
    setDescription('')
    setProvider('Generic')
    setEventTypesStr('*')
    setSignatureHeaderName('X-Webhook-Signature')
    setRejectInvalidSignature(false)
    setMaxRetryAttempts(5)
    setRetryStrategy('ExponentialBackoff')
    setError(null)
    setSelectedEndpoint(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    if (projects.length > 0) {
      setProjectId(projects[0].id)
    }
    setIsCreateOpen(true)
  }

  const handleOpenEdit = (endpoint: WebhookEndpoint, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedEndpoint(endpoint)
    setName(endpoint.name)
    setDescription(endpoint.description || '')
    setProvider(endpoint.provider)
    setEventTypesStr(endpoint.allowedEventTypes?.join(', ') || '*')
    setSignatureHeaderName(endpoint.signatureHeaderName)
    setRejectInvalidSignature(endpoint.rejectInvalidSignature)
    setMaxRetryAttempts(endpoint.maxRetryAttempts)
    setRetryStrategy(endpoint.retryStrategy)
    setError(null)
    setIsEditOpen(true)
  }

  const handleOpenDelete = (endpoint: WebhookEndpoint, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedEndpoint(endpoint)
    setError(null)
    setIsDeleteOpen(true)
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId) {
      setError('Please select a project')
      return
    }
    setError(null)

    // Process event types
    const allowedEventTypes = eventTypesStr
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)

    createMutation.mutate({
      projectId,
      name,
      description,
      provider,
      allowedEventTypes,
      signatureHeaderName,
      rejectInvalidSignature,
      maxRetryAttempts,
      retryStrategy
    })
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEndpoint) return
    setError(null)

    const allowedEventTypes = eventTypesStr
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)

    editMutation.mutate({
      id: selectedEndpoint.id,
      data: {
        name,
        description,
        allowedEventTypes,
        signatureHeaderName,
        rejectInvalidSignature,
        maxRetryAttempts,
        retryStrategy
      }
    })
  }

  const handleDeleteSubmit = () => {
    if (!selectedEndpoint) return
    setError(null)
    deleteMutation.mutate(selectedEndpoint.id)
  }

  const handleToggleActive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    toggleMutation.mutate(id)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-hf-accent" />
          <span className="text-hf-text-sec text-sm">Loading webhook endpoints...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-hf-text flex items-center gap-2.5">
            <Webhook size={24} className="text-hf-accent" />
            Webhook Endpoints
          </h1>
          <p className="text-sm text-hf-text-sec mt-0.5">{endpoints.length} endpoints total</p>
        </div>
        <button 
          onClick={handleOpenCreate} 
          disabled={projects.length === 0}
          className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5 shadow-glow-sm disabled:opacity-50"
        >
          <Plus size={15} /> New Endpoint
        </button>
      </div>

      {projects.length === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm rounded-xl p-4 flex gap-3 items-start">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">No active projects found</div>
            <p className="text-xs text-amber-400/80 mt-1">You must create at least one Active Project before setting up webhook endpoints.</p>
            <button onClick={() => navigate('/projects')} className="btn-secondary px-3 py-1 text-xs mt-3 flex items-center gap-1">
              Go to Projects <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {fetchError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-4">
          Error loading endpoints: {fetchError instanceof Error ? fetchError.message : 'Unknown error'}
        </div>
      )}

      {/* ─── Endpoint Grid ─── */}
      {endpoints.length === 0 ? (
        <div className="gradient-border rounded-2xl border-dashed border-2 p-12 text-center flex flex-col items-center justify-center gap-4 bg-hf-card/20">
          <div className="w-12 h-12 rounded-2xl bg-hf-hover flex items-center justify-center border border-hf-border">
            <Webhook size={24} className="text-hf-muted" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-hf-text">No webhook endpoints</h3>
            <p className="text-sm text-hf-text-sec max-w-sm mx-auto mt-1">
              Create an endpoint to receive real-time webhook payloads from third-party services.
            </p>
          </div>
          <button 
            onClick={handleOpenCreate} 
            disabled={projects.length === 0}
            className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5 shadow-glow-sm disabled:opacity-50"
          >
            <Plus size={15} /> Create your first endpoint
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {endpoints.map((endpoint) => (
            <div 
              key={endpoint.id}
              onClick={() => navigate(`/endpoints/${endpoint.id}`)}
              className="gradient-border rounded-2xl bg-hf-card p-5 cursor-pointer hover:border-hf-accent/40 shadow-card hover:shadow-glow-sm transition-all duration-200 group flex flex-col justify-between min-h-60"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-hf-text group-hover:text-violet-400 transition-colors truncate text-base">
                        {endpoint.name}
                      </h3>
                      <span className={`badge text-[10px] border px-2 py-0.5 ${providerColor[endpoint.provider]}`}>
                        {endpoint.provider}
                      </span>
                      <span className={`badge text-[10px] border px-2 py-0.5 ${
                        endpoint.isActive 
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                          : 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20'
                      }`}>
                        {endpoint.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs text-hf-muted mb-2">
                      <Folder size={12} className="text-hf-accent/70" />
                      <span>{endpoint.projectName}</span>
                      <span>•</span>
                      <span>slug: {endpoint.slug}</span>
                    </div>

                    <p className="text-xs text-hf-text-sec line-clamp-2">{endpoint.description || 'No description provided.'}</p>
                  </div>

                  {/* Quick controls */}
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleToggleActive(endpoint.id, e)}
                      title={endpoint.isActive ? "Deactivate" : "Activate"}
                      className={`p-1.5 rounded-lg border transition-all ${
                        endpoint.isActive 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                          : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-500 hover:bg-zinc-500/20'
                      }`}
                    >
                      <Activity size={13} />
                    </button>
                    <button 
                      onClick={(e) => handleOpenEdit(endpoint, e)}
                      title="Edit Endpoint"
                      className="p-1.5 rounded-lg bg-hf-bg hover:bg-hf-hover border border-hf-border text-hf-text-sec hover:text-hf-accent transition-colors"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button 
                      onClick={(e) => handleOpenDelete(endpoint, e)}
                      title="Delete Endpoint"
                      className="p-1.5 rounded-lg bg-hf-bg hover:bg-hf-hover border border-hf-border text-hf-text-sec hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Webhook Url Box */}
                <div 
                  className="mt-3 p-2.5 rounded-lg bg-hf-bg border border-hf-border flex items-center justify-between gap-3 text-xs font-mono"
                  onClick={e => e.stopPropagation()}
                >
                  <span className="text-hf-text-sec truncate flex-1">{endpoint.webhookUrl}</span>
                  <button 
                    onClick={() => copyToClipboard(endpoint.webhookUrl, endpoint.id)}
                    className="p-1 rounded bg-hf-hover text-hf-muted hover:text-hf-text transition-colors flex-shrink-0 border border-hf-border/40"
                    title="Copy Webhook URL"
                  >
                    {copiedId === endpoint.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              {/* Event types & Footer */}
              <div className="mt-4 pt-3 border-t border-hf-border/50 flex flex-wrap items-center justify-between gap-3 text-[10px] text-hf-muted">
                <div className="flex items-center gap-1 flex-wrap max-w-[70%]">
                  <span className="font-medium text-hf-text-sec">Events:</span>
                  {endpoint.allowedEventTypes && endpoint.allowedEventTypes.length > 0 ? (
                    endpoint.allowedEventTypes.slice(0, 3).map((t, idx) => (
                      <span key={idx} className="bg-hf-card-sec border border-hf-border rounded px-1.5 py-0.5 text-hf-text-sec">
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-hf-muted">All (*)</span>
                  )}
                  {endpoint.allowedEventTypes && endpoint.allowedEventTypes.length > 3 && (
                    <span className="text-hf-muted">+{endpoint.allowedEventTypes.length - 3} more</span>
                  )}
                </div>
                <span>Created {formatRelativeTime(endpoint.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── CREATE MODAL ─── */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-[#020204]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-lg gradient-border rounded-2xl bg-hf-card p-6 shadow-2xl space-y-4 my-8 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-hf-text flex items-center gap-2">
                <Plus size={18} className="text-hf-accent" /> Create Webhook Endpoint
              </h2>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 rounded-lg bg-hf-bg hover:bg-hf-hover text-hf-muted hover:text-hf-text transition-colors">
                <X size={16} />
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project Selection */}
                <div>
                  <label className="block text-xs font-semibold text-hf-text-sec mb-1.5 uppercase tracking-wider">Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="input-base"
                    required
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id} className="bg-hf-card">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Provider */}
                <div>
                  <label className="block text-xs font-semibold text-hf-text-sec mb-1.5 uppercase tracking-wider">Provider</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="input-base"
                  >
                    <option value="Generic" className="bg-hf-card">Generic</option>
                    <option value="GitHub" className="bg-hf-card">GitHub</option>
                    <option value="GenericHmac" className="bg-hf-card">Generic HMAC</option>
                    <option value="Payment" className="bg-hf-card">Payment (Stripe, Paypal)</option>
                    <option value="CiCd" className="bg-hf-card">CI/CD</option>
                    <option value="Internal" className="bg-hf-card">Internal App</option>
                  </select>
                </div>
              </div>

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
                  value={eventTypesStr}
                  onChange={(e) => setEventTypesStr(e.target.value)}
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
                <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-secondary px-4 py-2">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary px-5 py-2">
                  {createMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : 'Create Endpoint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT MODAL ─── */}
      {isEditOpen && selectedEndpoint && (
        <div className="fixed inset-0 bg-[#020204]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="w-full max-w-lg gradient-border rounded-2xl bg-hf-card p-6 shadow-2xl space-y-4 my-8 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-hf-text flex items-center gap-2">
                <Edit2 size={18} className="text-hf-accent" /> Edit Endpoint: {selectedEndpoint.name}
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
                  value={eventTypesStr}
                  onChange={(e) => setEventTypesStr(e.target.value)}
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

      {/* ─── DELETE MODAL ─── */}
      {isDeleteOpen && selectedEndpoint && (
        <div className="fixed inset-0 bg-[#020204]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md gradient-border rounded-2xl bg-hf-card p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
                <AlertTriangle size={18} /> Delete Webhook Endpoint?
              </h2>
              <button onClick={() => setIsDeleteOpen(false)} className="p-1 rounded-lg bg-hf-bg hover:bg-hf-hover text-hf-muted hover:text-hf-text transition-colors">
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
                Are you sure you want to delete <span className="font-semibold text-hf-text">"{selectedEndpoint.name}"</span>? 
                This action is permanent and cannot be undone.
              </p>
              <div className="p-3 bg-red-500/5 rounded-xl border border-red-500/10 text-[11px] text-red-400 flex gap-2 items-start">
                <ShieldAlert size={14} className="flex-shrink-0 mt-0.5 animate-pulse" />
                <span>All associated incoming event logs and retry attempts for this endpoint will also be permanently deleted.</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setIsDeleteOpen(false)} className="btn-secondary px-4 py-2">
                Cancel
              </button>
              <button 
                onClick={handleDeleteSubmit} 
                disabled={deleteMutation.isPending}
                className="btn bg-red-600 hover:bg-red-500 text-white font-medium shadow-glow-sm shadow-red-500/10 hover:shadow-red-500/20 active:scale-[0.98] px-5 py-2"
              >
                {deleteMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── SECRET KEY CREATED MODAL (ONCE) ─── */}
      {createdSecret && (
        <div className="fixed inset-0 bg-[#020204]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg gradient-border rounded-2xl bg-hf-card p-6 shadow-2xl space-y-4 accent-glow animate-scale-in">
            
            <div className="flex flex-col items-center text-center gap-3 py-2">
              <div className="w-12 h-12 rounded-full bg-violet-500/20 border border-hf-accent flex items-center justify-center text-hf-accent shadow-glow animate-pulse">
                <Sparkles size={22} fill="currentColor" className="opacity-80" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-hf-text">Endpoint Created Successfully!</h2>
                <p className="text-xs text-hf-text-sec max-w-sm mt-1">
                  Here is your secret key and webhook URL. Add these to your third-party provider to start receiving events.
                </p>
              </div>
            </div>

            {/* Secret key box */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-hf-text-sec uppercase tracking-wider">Secret Key (wh_sk_...)</label>
              <div className="p-3 rounded-lg bg-violet-950/10 border border-violet-500/30 flex items-center justify-between gap-3 font-mono text-sm">
                <span className="text-violet-300 font-semibold select-all break-all">{createdSecret.secretKey}</span>
                <button 
                  onClick={() => copyToClipboard(createdSecret.secretKey, 'secret')}
                  className="p-1.5 rounded bg-hf-card-sec text-hf-text-sec hover:text-hf-text border border-hf-border flex-shrink-0 transition-colors"
                  title="Copy Secret Key"
                >
                  {copiedId === 'secret' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Webhook url box */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-semibold text-hf-text-sec uppercase tracking-wider">Webhook URL</label>
              <div className="p-3 rounded-lg bg-hf-bg border border-hf-border flex items-center justify-between gap-3 font-mono text-xs">
                <span className="text-hf-text-sec truncate select-all">{createdSecret.webhookUrl}</span>
                <button 
                  onClick={() => copyToClipboard(createdSecret.webhookUrl, 'url')}
                  className="p-1.5 rounded bg-hf-card-sec text-hf-text-sec hover:text-hf-text border border-hf-border flex-shrink-0 transition-colors"
                  title="Copy Webhook URL"
                >
                  {copiedId === 'url' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Warning alert */}
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-xl p-3.5 flex gap-2.5 items-start">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Security Warning</div>
                <p className="text-[11px] text-amber-400/80 leading-relaxed mt-0.5">
                  This secret key is only shown **ONCE** for security reasons. HookFlow does not store this key in a recoverable raw form once you close this window. Please copy it and save it in a safe place.
                </p>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <button 
                onClick={() => setCreatedSecret(null)}
                className="btn-primary px-8 py-2.5 text-sm flex items-center gap-1.5 shadow-glow"
              >
                I have copied the key <Check size={14} />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
