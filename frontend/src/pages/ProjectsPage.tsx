import { Plus, BarChart2, Webhook, AlertTriangle } from 'lucide-react'
import { mockProjects } from '@/lib/mockData'
import { formatRelativeTime, formatPercent } from '@/lib/utils'

const statusColor: Record<string, string> = {
  Active: 'text-hf-success bg-hf-success-dim border-hf-success/20',
  Inactive: 'text-hf-muted bg-hf-hover border-hf-border',
  Archived: 'text-hf-muted bg-hf-hover border-hf-border',
}

export function ProjectsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-hf-text">Projects</h1>
          <p className="text-sm text-hf-text-sec mt-0.5">{mockProjects.length} projects total</p>
        </div>
        <button className="btn-primary px-4 py-2 text-sm">
          <Plus size={15} /> New Project
        </button>
      </div>

      {/* ─── Project Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
        {mockProjects.map((project) => (
          <div key={project.id} className="card-hover p-5 cursor-pointer group">
            {/* Card header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-hf-text group-hover:text-hf-accent-lt transition-colors truncate">
                    {project.name}
                  </h3>
                  <span className={`badge text-[10px] border ${statusColor[project.status]}`}>
                    {project.status}
                  </span>
                </div>
                <p className="text-xs text-hf-text-sec truncate">{project.description}</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-2.5 rounded-lg bg-hf-hover">
                <div className="flex items-center justify-center gap-1 text-hf-text font-bold text-sm">
                  <Webhook size={12} className="text-hf-accent" />
                  {project.endpointCount}
                </div>
                <div className="text-[10px] text-hf-muted mt-0.5">Endpoints</div>
              </div>
              <div className="text-center p-2.5 rounded-lg bg-hf-hover">
                <div className="flex items-center justify-center gap-1 text-hf-text font-bold text-sm">
                  <BarChart2 size={12} className="text-hf-info" />
                  {project.eventCount.toLocaleString()}
                </div>
                <div className="text-[10px] text-hf-muted mt-0.5">Events</div>
              </div>
              <div className="text-center p-2.5 rounded-lg bg-hf-hover">
                <div className={`flex items-center justify-center gap-1 font-bold text-sm ${
                  project.failureRate > 0.1 ? 'text-hf-danger' : project.failureRate > 0.05 ? 'text-hf-warning' : 'text-hf-success'
                }`}>
                  <AlertTriangle size={12} />
                  {formatPercent(project.failureRate)}
                </div>
                <div className="text-[10px] text-hf-muted mt-0.5">Fail rate</div>
              </div>
            </div>

            {/* Failure rate bar */}
            <div className="mb-3">
              <div className="h-1.5 bg-hf-hover rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    project.failureRate > 0.1 ? 'bg-hf-danger' : project.failureRate > 0.05 ? 'bg-hf-warning' : 'bg-hf-success'
                  }`}
                  style={{ width: `${Math.min(project.failureRate * 100 * 5, 100)}%` }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between text-[10px] text-hf-muted pt-3 border-t border-hf-border">
              <span>Updated {formatRelativeTime(project.updatedAt)}</span>
              <span className="text-hf-accent group-hover:underline">View project →</span>
            </div>
          </div>
        ))}

        {/* New Project Card */}
        <button className="card border-dashed border-2 p-5 flex flex-col items-center justify-center gap-3 min-h-48 hover:border-hf-accent/40 hover:bg-hf-accent-dim transition-all duration-200 group">
          <div className="w-10 h-10 rounded-xl bg-hf-hover group-hover:bg-hf-accent-dim border border-hf-border group-hover:border-hf-accent/30 flex items-center justify-center transition-all">
            <Plus size={18} className="text-hf-muted group-hover:text-hf-accent" />
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-hf-text-sec group-hover:text-hf-text">Create new project</div>
            <div className="text-xs text-hf-muted mt-0.5">Group your webhook endpoints</div>
          </div>
        </button>
      </div>
    </div>
  )
}
