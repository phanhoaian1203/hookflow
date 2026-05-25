import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'

// Pages
import { LandingPage }    from '@/pages/LandingPage'
import { LoginPage }      from '@/pages/LoginPage'
import { RegisterPage }   from '@/pages/RegisterPage'
import { DashboardPage }  from '@/pages/DashboardPage'
import { ProjectsPage }   from '@/pages/ProjectsPage'
import { ProjectDetailPage } from '@/pages/ProjectDetailPage'
import { EventLogsPage }  from '@/pages/EventLogsPage'
import { EventDetailPage }from '@/pages/EventDetailPage'
import { SimulatorPage }  from '@/pages/SimulatorPage'
import { EndpointsPage } from '@/pages/EndpointsPage'
import { EndpointDetailPage } from '@/pages/EndpointDetailPage'
import { RetryQueuePage } from '@/pages/RetryQueuePage'

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-4xl mb-4">🚧</div>
        <div className="text-hf-text font-semibold">{title}</div>
        <div className="text-hf-muted text-sm mt-1">Coming in a future version</div>
      </div>
    </div>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes (with AppLayout) */}
        <Route path="/dashboard"   element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
        <Route path="/projects"    element={<ProtectedRoute><AppLayout><ProjectsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><AppLayout><ProjectDetailPage /></AppLayout></ProtectedRoute>} />
        <Route path="/endpoints"   element={<ProtectedRoute><AppLayout><EndpointsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/endpoints/:id" element={<ProtectedRoute><AppLayout><EndpointDetailPage /></AppLayout></ProtectedRoute>} />
        <Route path="/events"      element={<ProtectedRoute><AppLayout><EventLogsPage /></AppLayout></ProtectedRoute>} />
        <Route path="/events/:id"  element={<ProtectedRoute><AppLayout><EventDetailPage /></AppLayout></ProtectedRoute>} />
        <Route path="/retry-queue" element={<ProtectedRoute><AppLayout><RetryQueuePage /></AppLayout></ProtectedRoute>} />
        <Route path="/simulator"   element={<ProtectedRoute><AppLayout><SimulatorPage /></AppLayout></ProtectedRoute>} />
        <Route path="/settings"    element={<ProtectedRoute><AppLayout><PlaceholderPage title="Settings" /></AppLayout></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
