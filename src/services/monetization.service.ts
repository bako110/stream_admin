import api from '@/lib/api'

export interface MonetizationRequest {
  id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  creator_type: string
  display_name: string
  description: string
  monthly_audience: string | null
  social_links: string | null
  has_existing_revenue: boolean
  admin_note: string | null
  created_at: string | null
  reviewed_at: string | null
  user: {
    id: string
    display_name: string | null
    username: string | null
    email: string
    avatar_url: string | null
  } | null
}

export const monetizationService = {
  async listRequests(status = 'pending', limit = 100, offset = 0): Promise<MonetizationRequest[]> {
    const { data } = await api.get<MonetizationRequest[]>('/monetization/admin/requests', {
      params: { status, limit, offset },
    })
    return data
  },

  async approveRequest(requestId: string): Promise<void> {
    await api.post(`/monetization/admin/requests/${requestId}/approve`)
  },

  async rejectRequest(requestId: string, note?: string): Promise<void> {
    await api.post(`/monetization/admin/requests/${requestId}/reject`, { note: note ?? null })
  },
}
