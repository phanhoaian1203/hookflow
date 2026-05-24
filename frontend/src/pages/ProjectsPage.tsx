import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { 
  Plus, BarChart2, Webhook, AlertTriangle, 
  Edit2, Trash2, Loader2, X, FolderKanban 
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  endpointCount: number
  eventCount: number
  createdAt: string
  updatedAt: string
}

const statusColor: Record<string, string> = {
  Active: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Inactive: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
  Archived: 'text-zinc-500 bg-zinc-500/5 border-zinc-500/10',
}

export function ProjectsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Selected project for edit/delete
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('Active')
  const [error, setError] = useState<string | null>(null)

  // 1. Fetch user projects
  const { data: projects = [], isLoading, error: fetchError } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects')
      if (response.data && response.data.success) {
        return response.data.data
      }
      throw new Error(response.data.message || 'Failed to fetch projects')
    }
  })

  // 2. Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; description: string }) => {
      const response = await api.post('/projects', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setIsCreateOpen(false)
      resetForm()
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Failed to create project')
    }
  })

  const editMutation = useMutation({
    mutationFn: async (payload: { id: string; name: string; description: string; status: string }) => {
      const { id, ...rest } = payload
      const response = await api.put(`/projects/${id}`, rest)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setIsEditOpen(false)
      resetForm()
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Failed to update project')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/projects/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setIsDeleteOpen(false)
      setSelectedProject(null)
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || err.message || 'Failed to delete project')
    }
  })

  const resetForm = () => {
    setName('')
    setDescription('')
    setStatus('Active')
    setError(null)
    setSelectedProject(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setIsCreateOpen(true)
  }

  const handleOpenEdit = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedProject(project)
    setName(project.name)
    setDescription(project.description || '')
    setStatus(project.status)
    setError(null)
    setIsEditOpen(true)
  }

  const handleOpenDelete = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedProject(project)
    setError(null)
    setIsDeleteOpen(true)
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    createMutation.mutate({ name, description })
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return
    setError(null)
    editMutation.mutate({ id: selectedProject.id, name, description, status })
  }

  const handleDeleteSubmit = () => {
    if (!selectedProject) return
    setError(null)
    deleteMutation.mutate(selectedProject.id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-hf-accent" />
          <span className="text-hf-text-sec text-sm">Loading projects...</span>
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
            <FolderKanban size={24} className="text-hf-accent" />
            Projects
          </h1>
          <p className="text-sm text-hf-text-sec mt-0.5">{projects.length} projects total</p>
        </div>
        <button onClick={handleOpenCreate} className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5 shadow-glow-sm">
          <Plus size={15} /> New Project
        </button>
      </div>

      {fetchError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-4">
          Error loading projects: {fetchError instanceof Error ? fetchError.message : 'Unknown error'}
        </div>
      )}

      {/* ─── Project Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {projects.map((project) => (
          <div 
            key={project.id} 
            onClick={() => navigate(`/projects/${project.id}`)}
            className="gradient-border rounded-2xl bg-hf-card p-5 cursor-pointer hover:border-hf-accent/40 shadow-card hover:shadow-glow-sm transition-all duration-200 group relative flex flex-col justify-between min-h-52"
          >
            <div>
              {/* Card header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-hf-text group-hover:text-violet-400 transition-colors truncate text-base">
                      {project.name}
                    </h3>
                    <span className={`badge text-[10px] border px-2 py-0.5 ${statusColor[project.status]}`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-xs text-hf-text-sec line-clamp-2">{project.description || 'No description provided.'}</p>
                </div>

                {/* Edit/Delete Buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button 
                    onClick={(e) => handleOpenEdit(project, e)}
                    title="Edit Project"
                    className="p-1.5 rounded-lg bg-hf-bg hover:bg-hf-hover border border-hf-border text-hf-text-sec hover:text-hf-accent transition-colors"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button 
                    onClick={(e) => handleOpenDelete(project, e)}
                    title="Delete Project"
                    className="p-1.5 rounded-lg bg-hf-bg hover:bg-hf-hover border border-hf-border text-hf-text-sec hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-2 rounded-lg bg-hf-hover border border-hf-border/50">
                  <div className="flex items-center justify-center gap-1 text-hf-text font-bold text-sm">
                    <Webhook size={13} className="text-hf-accent" />
                    {project.endpointCount}
                  </div>
                  <div className="text-[10px] text-hf-muted mt-0.5">Endpoints</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-hf-hover border border-hf-border/50">
                  <div className="flex items-center justify-center gap-1 text-hf-text font-bold text-sm">
                    <BarChart2 size={13} className="text-blue-400" />
                    {project.eventCount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-hf-muted mt-0.5">Events</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[10px] text-hf-muted pt-3 border-t border-hf-border/50 mt-auto">
              <span>Updated {formatRelativeTime(project.updatedAt)}</span>
              <span className="text-violet-400 font-medium group-hover:translate-x-0.5 transition-transform">View project →</span>
            </div>
          </div>
        ))}

        {/* New Project Card Button */}
        <button 
          onClick={handleOpenCreate}
          className="gradient-border rounded-2xl border-dashed border-2 p-5 flex flex-col items-center justify-center gap-3 min-h-52 hover:border-hf-accent/40 hover:bg-violet-500/5 transition-all duration-200 group"
        >
          <div className="w-10 h-10 rounded-xl bg-hf-hover group-hover:bg-violet-500/10 border border-hf-border group-hover:border-hf-accent/30 flex items-center justify-center transition-all shadow-glow-sm">
            <Plus size={18} className="text-hf-muted group-hover:text-hf-accent" />
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-hf-text-sec group-hover:text-hf-text">Create new project</div>
            <div className="text-xs text-hf-muted mt-0.5">Group your webhook endpoints</div>
          </div>
        </button>
      </div>

      {/* ─── CREATE MODAL ─── */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-[#020204]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md gradient-border rounded-2xl bg-hf-card p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-hf-text flex items-center gap-2">
                <Plus size={18} className="text-hf-accent" /> Create New Project
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
              <div>
                <label className="block text-xs font-semibold text-hf-text-sec mb-1.5 uppercase tracking-wider">Project Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Stripe Gateway"
                  className="input-base"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-hf-text-sec mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the purpose of this project..."
                  rows={3}
                  className="input-base resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-hf-border/50">
                <button 
                  type="button" 
                  onClick={() => setIsCreateOpen(false)} 
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-hf-hover hover:bg-hf-card border border-hf-border text-hf-text hover:text-hf-text transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createMutation.isPending}
                  className="btn-primary px-4 py-2 text-xs flex items-center gap-1.5 shadow-glow-sm"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Creating...
                    </>
                  ) : (
                    'Create Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT MODAL ─── */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-[#020204]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-md gradient-border rounded-2xl bg-hf-card p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-hf-text flex items-center gap-2">
                <Edit2 size={16} className="text-hf-accent" /> Edit Project
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
              <div>
                <label className="block text-xs font-semibold text-hf-text-sec mb-1.5 uppercase tracking-wider">Project Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-base"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-hf-text-sec mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="input-base resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-hf-text-sec mb-1.5 uppercase tracking-wider">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input-base appearance-none cursor-pointer bg-hf-bg"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-hf-border/50">
                <button 
                  type="button" 
                  onClick={() => setIsEditOpen(false)} 
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-hf-hover hover:bg-hf-card border border-hf-border text-hf-text hover:text-hf-text transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={editMutation.isPending}
                  className="btn-primary px-4 py-2 text-xs flex items-center gap-1.5 shadow-glow-sm"
                >
                  {editMutation.isPending ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM MODAL ─── */}
      {isDeleteOpen && selectedProject && (
        <div className="fixed inset-0 bg-[#020204]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm gradient-border rounded-2xl bg-hf-card p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between text-red-400">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle size={20} /> Delete Project?
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

            <div className="text-xs text-hf-text-sec space-y-2.5">
              <p>
                Are you sure you want to delete <strong className="text-hf-text">{selectedProject.name}</strong>?
              </p>
              <p className="bg-red-500/10 border border-red-500/20 text-red-400 p-2.5 rounded-lg flex items-start gap-2 leading-relaxed">
                <span>⚠️</span>
                <span>
                  This action is permanent and will cascade-delete all endpoints, retry schedules, and webhook log events inside this project.
                </span>
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-hf-border/50">
              <button 
                onClick={() => setIsDeleteOpen(false)} 
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-hf-hover hover:bg-hf-card border border-hf-border text-hf-text hover:text-hf-text transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteSubmit}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white transition-all shadow-glow-sm flex items-center gap-1.5"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Deleting...
                  </>
                ) : (
                  'Delete Forever'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
