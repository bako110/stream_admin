import api from '@/lib/api'

export interface SupportMessage {
  id: string
  ticket_id: string
  sender_id: string
  body: string
  is_staff: boolean
  created_at: string
  sender_name: string | null
  sender_avatar: string | null
  sender_role: string | null
}

export interface SupportTicket {
  id: string
  subject: string
  status: 'open' | 'pending' | 'resolved' | 'closed'
  created_at: string
  updated_at: string
  unread_count: number
  viewed_at: string | null
  viewed_by_name: string | null
  user: {
    id: string
    display_name: string | null
    username: string | null
    email: string
    avatar_url: string | null
  } | null
  messages: SupportMessage[]
}

export const supportService = {
  async listTickets(status?: string): Promise<SupportTicket[]> {
    const { data } = await api.get<SupportTicket[]>('/support/admin/tickets', {
      params: status ? { status } : {},
    })
    return data
  },

  async getTicket(ticketId: string): Promise<SupportTicket> {
    const { data } = await api.get<SupportTicket>(`/support/admin/tickets/${ticketId}`)
    return data
  },

  async reply(ticketId: string, body: string): Promise<SupportMessage> {
    const { data } = await api.post<SupportMessage>(`/support/admin/tickets/${ticketId}/messages`, { body })
    return data
  },

  async setStatus(ticketId: string, status: string): Promise<void> {
    await api.patch(`/support/admin/tickets/${ticketId}/status`, { status })
  },
}
