import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api } from '@/lib/api'

interface User {
  id: string
  fullName: string
  email: string
  role: string
  createdAt?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (fullName: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch current user details on app load
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('hf_token')
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const response = await api.get('/auth/me')
        if (response.data && response.data.success) {
          setUser(response.data.data)
        }
      } catch (err) {
        console.error('Failed to load user profile on boot', err)
        localStorage.removeItem('hf_token')
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await api.post('/auth/login', { email, password })
      if (response.data && response.data.success) {
        const { accessToken, user: userData } = response.data.data
        localStorage.setItem('hf_token', accessToken)
        setUser(userData)
      } else {
        throw new Error(response.data.message || 'Login failed')
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Login failed'
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (fullName: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await api.post('/auth/register', { fullName, email, password })
      if (response.data && response.data.success) {
        const { accessToken, user: userData } = response.data.data
        localStorage.setItem('hf_token', accessToken)
        setUser(userData)
      } else {
        throw new Error(response.data.message || 'Registration failed')
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Registration failed'
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('hf_token')
    setUser(null)
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
