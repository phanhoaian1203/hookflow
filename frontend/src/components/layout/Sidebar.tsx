import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, Webhook, FileText,
  RefreshCw, FlaskConical, Settings, Zap, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',   to: '/dashboard' },
  { icon: FolderKanban,   label: 'Projects',     to: '/projects' },
  { icon: Webhook,        label: 'Endpoints',    to: '/endpoints' },
  { icon: FileText,       label: 'Event Logs',   to: '/events' },
  { icon: RefreshCw,      label: 'Retry Queue',  to: '/retry-queue' },
  { icon: FlaskConical,   label: 'Simulator',    to: '/simulator' },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-60 flex-shrink-0 h-screen flex flex-col border-r border-hf-border bg-hf-bg-sec">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-hf-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-hf-accent to-purple-500 flex items-center justify-center shadow-glow-sm">
            <Zap size={16} className="text-white" fill="white" />
          </div>
          <div>
            <span className="text-hf-text font-bold text-base tracking-tight">HookFlow</span>
            <div className="text-[10px] text-hf-muted font-medium -mt-0.5">Webhook Processor</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="text-[10px] font-semibold text-hf-muted uppercase tracking-widest px-3 mb-2">
          Main Menu
        </div>
        {navItems.map(({ icon: Icon, label, to }) => {
          const isActive = location.pathname.startsWith(to)
          return (
            <NavLink key={to} to={to}>
              <div className={cn(isActive ? 'nav-item-active' : 'nav-item', 'group')}>
                <Icon
                  size={16}
                  className={cn(
                    'flex-shrink-0 transition-colors',
                    isActive ? 'text-hf-accent' : 'text-hf-muted group-hover:text-hf-text-sec'
                  )}
                />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={12} className="text-hf-accent opacity-60" />}
              </div>
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom: Settings + User */}
      <div className="px-3 py-4 border-t border-hf-border space-y-0.5">
        <NavLink to="/settings">
          <div className={cn(
            location.pathname === '/settings' ? 'nav-item-active' : 'nav-item'
          )}>
            <Settings size={16} className="text-hf-muted" />
            <span>Settings</span>
          </div>
        </NavLink>

        {/* User avatar */}
        <div className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-lg bg-hf-hover border border-hf-border">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-hf-accent to-purple-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            N
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-hf-text truncate">Ngoc Anh</div>
            <div className="text-[10px] text-hf-muted truncate">dev@example.com</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
