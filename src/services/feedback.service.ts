import api from '@/lib/api'
import type { FeedbackListResponse } from '@/types'

export const feedbackService = {
  async list(status = 'nouveau', category?: string, page = 1, limit = 30): Promise<FeedbackListResponse> {
    const params: Record<string, unknown> = { page, limit }
    if (status !== 'all') params.status = status
    if (category) params.category = category
    const { data } = await api.get<FeedbackListResponse>('/feedback/admin', { params })
    return data
  },

  async markRead(feedbackId: string): Promise<void> {
    await api.patch(`/feedback/admin/${feedbackId}/read`)
  },

  async respond(feedbackId: string, response: string): Promise<void> {
    await api.patch(`/feedback/admin/${feedbackId}/respond`, { response })
  },
}
