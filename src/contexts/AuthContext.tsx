import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authService } from '@/services/auth.service'
import type { User } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (identifier: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      authService.getMe()
        .then(u => {
          if (u.role !== 'admin' && u.role !== 'manager') {
            localStorage.clear()
            setUser(null)
          } else {
            setUser(u)
          }
        })
        .catch(async (err) => {
          // 401 → tenter le refresh avant de tout vider
          if (err?.response?.status === 401) {
            const refresh = localStorage.getItem('refresh_token')
            if (refresh) {
              try {
                const { default: api } = await import('@/lib/api')
                const { data } = await api.post('/auth/refresh', { refresh_token: refresh })
                localStorage.setItem('access_token', data.access_token)
                if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token)
                const u = await authService.getMe()
                if (u.role !== 'admin' && u.role !== 'manager') {
                  localStorage.clear(); setUser(null)
                } else {
                  setUser(u)
                }
                return
              } catch {
                // refresh échoué → déconnexion propre
              }
            }
          }
          localStorage.clear()
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function login(identifier: string, password: string) {
    const res = await authService.login(identifier, password)
    if (res.user.role !== 'admin' && res.user.role !== 'manager') {
      throw new Error('Accès réservé aux administrateurs et managers')
    }
    localStorage.setItem('access_token', res.access_token)
    localStorage.setItem('refresh_token', res.refresh_token)
    setUser(res.user)
  }

  async function logout() {
    await authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
