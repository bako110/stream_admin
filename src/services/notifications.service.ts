import api from '@/lib/api'

export interface AdminNotificationPayload {
  title?: string
  body: string
}

export interface AdminAnnouncementImagePayload extends AdminNotificationPayload {
  image_url?: string
}

export type AppUpdatePlatform = 'android' | 'ios' | 'all'

export interface AdminAppUpdatePayload {
  title?: string
  body: string
  platform: AppUpdatePlatform
  image_url?: string
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

  async broadcastWithImage(payload: AdminAnnouncementImagePayload): Promise<{ sent: number }> {
    const { data } = await api.post<{ sent: number }>('/admin/notifications/broadcast-image', payload)
    return data
  },

  async sendToUser(userId: string, payload: AdminNotificationPayload): Promise<{ sent: boolean }> {
    const { data } = await api.post<{ sent: boolean }>(`/admin/notifications/send/${userId}`, payload)
    return data
  },

  async sendAppUpdate(payload: AdminAppUpdatePayload): Promise<{ sent: number; platform: AppUpdatePlatform }> {
    const { data } = await api.post<{ sent: number; platform: AppUpdatePlatform }>('/admin/notifications/app-update', payload)
    return data
  },

  async searchUsers(q: string): Promise<AdminUserResult[]> {
    if (!q.trim()) return []
    const { data } = await api.get<AdminUserResult[]>('/admin/users', { params: { q, limit: 15 } })
    return data
  },
}
