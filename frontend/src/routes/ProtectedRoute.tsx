import { Navigate } from 'react-router-dom'
import { type ReactNode } from 'react'

// v0.2: Mock auth check — always logged in for demo
// v0.4: Replace with real JWT token validation
const isMockLoggedIn = () => {
  return localStorage.getItem('hf_mock_auth') !== 'false'
}

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!isMockLoggedIn()) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
