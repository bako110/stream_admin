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
  auto_review_at: string | null
  auto_approved: boolean
  user: {
    id: string
    display_name: string | null
    username: string | null
    email: string
    avatar_url: string | null
  } | null
}

export interface UserDetail {
  user_id: string
  is_active: boolean
  is_verified: boolean
  verification_status: string
  account_age_days: number | null
  created_at: string | null
  followers_count: number
  following_count: number
  reels_count: number
  posts_count: number
  total_reports_received: number
  pending_reports: number
}

export const monetizationService = {
  async listRequests(status = 'pending', limit = 100, offset = 0): Promise<MonetizationRequest[]> {
    const { data } = await api.get<MonetizationRequest[]>('/monetization/admin/requests', {
      params: { status, limit, offset },
    })
    return data
  },

  async getUserDetail(requestId: string): Promise<UserDetail> {
    const { data } = await api.get<UserDetail>(`/monetization/admin/requests/${requestId}/user-detail`)
    return data
  },

  async approveRequest(requestId: string): Promise<void> {
    await api.post(`/monetization/admin/requests/${requestId}/approve`)
  },

  async rejectRequest(requestId: string, note: string): Promise<void> {
    await api.post(`/monetization/admin/requests/${requestId}/reject`, { note })
  },
}
