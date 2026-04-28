import api from '@/lib/api'
import type { ReportListResponse } from '@/types'

export const reportsService = {
  async list(status = 'pending', page = 1, limit = 30, contentType?: string): Promise<ReportListResponse> {
    const params: Record<string, unknown> = { status, page, limit }
    if (contentType) params.content_type = contentType
    const { data } = await api.get<ReportListResponse>('/reports/admin', { params })
    return data
  },

  async deleteContent(reportId: string): Promise<void> {
    await api.delete(`/reports/admin/${reportId}/content`)
  },

  async dismiss(reportId: string): Promise<void> {
    await api.patch(`/reports/admin/${reportId}/dismiss`)
  },
}
