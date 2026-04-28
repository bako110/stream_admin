import api from '@/lib/api'
import type { User, UserRole, UserContent } from '@/types'

export const usersService = {
  async listPendingVerification(): Promise<User[]> {
    const { data } = await api.get<User[]>('/users', { params: { verification_status: 'pending', limit: 100 } })
    return data
  },

  async reviewVerification(userId: string, action: 'approve' | 'reject', note?: string): Promise<User> {
    const { data } = await api.patch<User>(`/users/${userId}/verify`, { approved: action === 'approve', note })
    return data
  },

  async list(page = 1, limit = 20, role?: string): Promise<User[]> {
    const params: Record<string, unknown> = { page, limit }
    if (role) params.role = role
    const { data } = await api.get<User[]>('/users', { params })
    return data
  },

  async changeRole(userId: string, role: UserRole): Promise<void> {
    await api.put(`/users/${userId}/role`, null, { params: { role } })
  },

  async deactivate(userId: string): Promise<User> {
    const { data } = await api.patch<User>(`/users/${userId}/deactivate`)
    return data
  },

  async activate(userId: string): Promise<User> {
    const { data } = await api.patch<User>(`/users/${userId}/activate`)
    return data
  },

  async delete(userId: string): Promise<void> {
    await api.delete(`/users/${userId}`)
  },

  async getUserContent(userId: string, q?: string, type?: string): Promise<UserContent> {
    const params: Record<string, string> = {}
    if (q) params.q = q
    if (type) params.type = type
    const { data } = await api.get<UserContent>(`/users/${userId}/admin/content`, { params })
    return data
  },

  async deleteContent(userId: string, contentType: 'reel' | 'event' | 'concert', contentId: string): Promise<void> {
    await api.delete(`/users/${userId}/admin/content/${contentType}/${contentId}`)
  },

  async createManager(payload: {
    first_name: string
    last_name: string
    email: string
    password: string
    username?: string
  }): Promise<User> {
    const { data } = await api.post<User>('/auth/register', payload)
    await api.put(`/users/${data.id}/role`, null, { params: { role: 'admin' } })
    return data
  },
}
