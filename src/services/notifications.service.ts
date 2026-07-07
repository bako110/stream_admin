import api from '@/lib/api'

export interface AdminNotificationPayload {
  title?: string
  body: string
}

export interface AdminUserResult {
  id: string
  username: string | null
  display_name: string | null
  email: string
  avatar_url: string | null
  is_verified: boolean
}

export const notificationsService = {
  async broadcast(payload: AdminNotificationPayload): Promise<{ sent: number }> {
    const { data } = await api.post<{ sent: number }>('/admin/notifications/broadcast', payload)
    return data
  },

  async sendToUser(userId: string, payload: AdminNotificationPayload): Promise<{ sent: boolean }> {
    const { data } = await api.post<{ sent: boolean }>(`/admin/notifications/send/${userId}`, payload)
    return data
  },

  async searchUsers(q: string): Promise<AdminUserResult[]> {
    if (!q.trim()) return []
    const { data } = await api.get<AdminUserResult[]>('/admin/users', { params: { q, limit: 15 } })
    return data
  },
}
