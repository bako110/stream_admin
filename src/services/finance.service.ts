import api from '@/lib/api'

export interface FinanceOverview {
  revenue: { total_eur: number; this_month_eur: number; last_month_eur: number }
  withdrawals: { pending_count: number; total_paid_eur: number }
  payments: { total_eur: number; this_month_eur: number }
  subscriptions: { active_count: number }
  transaction_breakdown: { type: string; count: number; coins: number; eur: number }[]
}

export interface Transaction {
  id: string
  user: { email: string; name: string; username: string | null }
  type: string
  status: string
  coins_amount: number
  eur_amount: number | null
  balance_after: number | null
  description: string | null
  reference_type: string | null
  created_at: string
}

export interface TransactionList {
  total: number
  page: number
  limit: number
  items: Transaction[]
}

export interface Withdrawal {
  id: string
  user: { email: string; name: string }
  coins_amount: number
  eur_amount: number
  status: string
  payout_method: string | null
  admin_note: string | null
  processed_at: string | null
  created_at: string
}

export interface WithdrawalList {
  total: number
  page: number
  limit: number
  items: Withdrawal[]
}

export const financeService = {
  async getOverview(): Promise<FinanceOverview> {
    const { data } = await api.get<FinanceOverview>('/finance/overview')
    return data
  },

  async getTransactions(page = 1, limit = 50, type?: string, status?: string, transactionId?: string, userEmail?: string): Promise<TransactionList> {
    const params: Record<string, unknown> = { page, limit }
    if (type) params.tx_type = type
    if (status) params.status = status
    if (transactionId) params.transaction_id = transactionId
    if (userEmail) params.user_email = userEmail
    const { data } = await api.get<TransactionList>('/finance/transactions', { params })
    return data
  },

  async getWithdrawals(page = 1, limit = 50, status?: string): Promise<WithdrawalList> {
    const params: Record<string, unknown> = { page, limit }
    if (status) params.status = status
    const { data } = await api.get<WithdrawalList>('/finance/withdrawals', { params })
    return data
  },

  async approveWithdrawal(id: string, note?: string): Promise<void> {
    const params: Record<string, unknown> = {}
    if (note) params.admin_note = note
    await api.post(`/wallet/admin/withdrawals/${id}/approve`, null, { params })
  },

  async rejectWithdrawal(id: string, note?: string): Promise<void> {
    const params: Record<string, unknown> = {}
    if (note) params.admin_note = note
    await api.post(`/wallet/admin/withdrawals/${id}/reject`, null, { params })
  },
}
