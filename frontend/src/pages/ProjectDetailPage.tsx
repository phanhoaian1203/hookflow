import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  FolderKanban, Calendar, Clock, ArrowLeft, Loader2,
  ExternalLink, Layers, ShieldCheck, AlertCircle, Webhook,
  CheckCircle2, XCircle, Plus, Globe, ChevronRight
} from 'lucide-react'
import type { WebhookEndpoint } from '@/types/endpoint.types'

interface ProjectDetail {
  id: string
  name: string
  description: string | null
  status: string
  endpointCount: number
  eventCount: number
  createdAt: string
  updatedAt: string
}

const providerColor: Record<string, string> = {
  Generic:     'text-blue-400   bg-blue-500/10   border-blue-500/20',
  GitHub:      'text-zinc-300   bg-zinc-500/10   border-zinc-500/20',
  GenericHmac: 'text-amber-400  bg-amber-500/10  border-amber-500/20',
  Payment:     'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  CiCd:        'text-purple-400 bg-purple-500/10 border-purple-500/20',
  Internal:    'text-pink-400   bg-pink-500/10   border-pink-500/20',
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()

  // ── Project detail ─────────────────────────────────────────────────────────
  const { data: project, isLoading, error } = useQuery<ProjectDetail>({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`)
      if (response.data && response.data.success) {
        return response.data.data
      }
      throw new Error(response.data.message || 'Failed to load project details')
    },
    enabled: !!id,
  })

  // ── Endpoints of this project ──────────────────────────────────────────────
  const { data: endpoints = [], isLoading: endpointsLoading } = useQuery<WebhookEndpoint[]>({
    queryKey: ['project-endpoints', id],
    queryFn: async () => {
      const response = await api.get(`/webhook-endpoints/project/${id}`)
      if (response.data && response.data.success) {
        return response.data.data
      }
      return []
    },
    enabled: !!id,
  })

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-hf-accent" />
          <span className="text-hf-text-sec text-sm">Loading project details...</span>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex flex-col items-center gap-4 text-center">
          <AlertCircle size={40} className="text-red-400" />
          <h2 className="text-lg font-bold text-hf-text">Error Loading Project</h2>
          <p className="text-hf-text-sec text-sm max-w-md">
            {error instanceof Error ? error.message : 'The project you are looking for does not exist or you do not have permission.'}
          </p>
          <Link to="/projects" className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Projects
          </Link>
        </div>
      </div>
    )
  }

  const formattedDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* ── Header & Back Button ── */}
      <div className="flex items-center gap-4">
        <Link
          to="/projects"
          className="p-2 rounded-lg bg-hf-card hover:bg-hf-hover border border-hf-border text-hf-text-sec hover:text-hf-text transition-all"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <div className="text-xs text-hf-muted font-medium flex items-center gap-1.5 mb-0.5">
            <Link to="/projects" className="hover:text-hf-accent">Projects</Link>
            <span>/</span>
            <span className="text-hf-text-sec">Details</span>
          </div>
          <h1 className="text-2xl font-bold text-hf-text flex items-center gap-2.5">
            <FolderKanban size={24} className="text-hf-accent" />
            {project.name}
          </h1>
        </div>
      </div>

      {/* ── Grid Overview ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left — Main Details */}
        <div className="md:col-span-2 gradient-border rounded-2xl bg-hf-card p-6 space-y-5 shadow-card">
          <div>
            <h3 className="text-xs font-semibold text-hf-muted uppercase tracking-wider mb-2">Description</h3>
            <p className="text-hf-text-sec text-sm leading-relaxed">
              {project.description || 'No description provided for this project.'}
            </p>
          </div>

          <div className="border-t border-hf-border/50 pt-5 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2.5 text-xs text-hf-text-sec">
              <Calendar size={14} className="text-hf-muted" />
              <div>
                <span className="text-hf-muted block">Created At</span>
                <span className="font-medium text-hf-text">{formattedDate(project.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-hf-text-sec">
              <Clock size={14} className="text-hf-muted" />
              <div>
                <span className="text-hf-muted block">Last Updated</span>
                <span className="font-medium text-hf-text">{formattedDate(project.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Status & Stats */}
        <div className="gradient-border rounded-2xl bg-hf-card p-6 flex flex-col justify-between shadow-card space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-hf-muted uppercase tracking-wider mb-2">Status</h3>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                project.status === 'Active'   ? 'bg-emerald-500/10 text-emerald-400' :
                project.status === 'Inactive' ? 'bg-amber-500/10  text-amber-400'   :
                'bg-zinc-500/10 text-zinc-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  project.status === 'Active'   ? 'bg-emerald-400 animate-pulse' :
                  project.status === 'Inactive' ? 'bg-amber-400'                 :
                  'bg-zinc-400'
                }`} />
                {project.status}
              </span>
            </div>

            <div className="border-t border-hf-border/50 pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-hf-text-sec flex items-center gap-1.5">
                  <Layers size={14} className="text-hf-muted" /> Endpoints:
                </span>
                <span className="font-semibold text-hf-text bg-hf-bg px-2.5 py-0.5 rounded-lg border border-hf-border">
                  {project.endpointCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-hf-text-sec flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-hf-muted" /> Events Received:
                </span>
                <span className="font-semibold text-hf-text bg-hf-bg px-2.5 py-0.5 rounded-lg border border-hf-border">
                  {project.eventCount}
                </span>
              </div>
            </div>
          </div>

          <Link to="/endpoints" className="btn-primary w-full py-2 text-sm flex items-center justify-center gap-2">
            Manage Endpoints <ExternalLink size={14} />
          </Link>
        </div>
      </div>

      {/* ── Webhook Endpoints List ── */}
      <div className="gradient-border rounded-2xl bg-hf-card p-6 shadow-card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-hf-text flex items-center gap-2">
            <Webhook size={18} className="text-hf-accent" />
            Webhook Endpoints
          </h2>
          <Link
            to="/endpoints"
            className="flex items-center gap-1.5 text-xs text-hf-accent hover:text-hf-accent-lt transition-colors px-3 py-1.5 rounded-lg border border-hf-accent/30 hover:border-hf-accent/60 bg-hf-accent/5 hover:bg-hf-accent/10"
          >
            <Plus size={12} /> Add Endpoint
          </Link>
        </div>

        {endpointsLoading ? (
          <div className="flex items-center gap-2 text-hf-muted text-sm py-6 justify-center">
            <Loader2 size={16} className="animate-spin" />
            Loading endpoints...
          </div>
        ) : endpoints.length === 0 ? (
          <div className="border border-dashed border-hf-border rounded-xl p-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-hf-bg flex items-center justify-center mb-3">
              <Webhook size={20} className="text-hf-muted" />
            </div>
            <p className="text-hf-text-sec text-sm mb-1 font-medium">No endpoints configured yet</p>
            <p className="text-hf-muted text-xs max-w-sm mb-4">
              Create an incoming webhook endpoint to start receiving events from GitHub, Stripe, Shopify, or custom sources.
            </p>
            <Link to="/endpoints" className="btn-primary px-4 py-2 text-xs flex items-center gap-1.5">
              <Plus size={13} /> Add Webhook Endpoint
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {endpoints.map(ep => (
              <Link
                key={ep.id}
                to={`/endpoints/${ep.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-hf-border bg-hf-bg hover:border-hf-accent/30 hover:bg-hf-hover transition-all group"
              >
                {/* Active indicator */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ep.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />

                {/* Name & URL */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-hf-text truncate">{ep.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium flex-shrink-0 ${providerColor[ep.provider] ?? providerColor.Generic}`}>
                      {ep.provider}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-hf-muted">
                    <Globe size={9} />
                    <span className="truncate">/api/incoming-webhooks/{ep.slug}</span>
                  </div>
                </div>

                {/* Status badge */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {ep.isActive ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <CheckCircle2 size={12} /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <XCircle size={12} /> Inactive
                    </span>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight size={14} className="text-hf-muted group-hover:text-hf-accent transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
