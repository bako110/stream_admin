import api from '@/lib/api'
import type { LoginResponse, User } from '@/types'

export const authService = {
  async login(identifier: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', { identifier, password })
    return data
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/auth/me')
    return data
  },

  async logout() {
    try { await api.post('/auth/logout') } catch { /* stateless */ }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  },
}
