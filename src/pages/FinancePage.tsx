import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { financeService } from '@/services/finance.service'
import { TrendingUp, TrendingDown, Wallet, Users, ArrowDownCircle, CreditCard } from 'lucide-react'
import clsx from 'clsx'

const TX_TYPE_LABELS: Record<string, string> = {
  credit_purchase:      'Achat coins',
  gift_sent:            'Cadeau envoyé',
  gift_received:        'Cadeau reçu',
  transfer_sent:        'Transfert envoyé',
  transfer_received:    'Transfert reçu',
  withdrawal:           'Retrait',
  subscription_revenue: 'Revenu abonnement',
  view_revenue:         'Revenu vues',
  bonus:                'Bonus',
  refund:               'Remboursement',
  boost_purchase:       'Boost visibilité',
  community_entry:      'Communauté payante',
  community_reward:     'Gain communauté',
  verification_fee:     'Frais vérification',
  verification_refund:  'Remboursement vérif.',
  content_purchase:     'Achat PPV',
  referral_bonus:       'Commission parrainage',
}

const TX_TYPE_COLORS: Record<string, string> = {
  credit_purchase:      'bg-emerald-500/15 text-emerald-400',
  gift_sent:            'bg-pink-500/15 text-pink-400',
  gift_received:        'bg-pink-500/15 text-pink-300',
  transfer_sent:        'bg-blue-500/15 text-blue-400',
  transfer_received:    'bg-blue-500/15 text-blue-300',
  withdrawal:           'bg-orange-500/15 text-orange-400',
  subscription_revenue: 'bg-violet-500/15 text-violet-400',
  view_revenue:         'bg-teal-500/15 text-teal-400',
  bonus:                'bg-amber-500/15 text-amber-400',
  refund:               'bg-red-500/15 text-red-400',
  boost_purchase:       'bg-cyan-500/15 text-cyan-400',
  community_entry:      'bg-indigo-500/15 text-indigo-400',
  community_reward:     'bg-indigo-500/15 text-indigo-300',
  verification_fee:     'bg-gray-500/15 text-gray-400',
  verification_refund:  'bg-gray-500/15 text-gray-300',
  content_purchase:     'bg-yellow-500/15 text-yellow-400',
  referral_bonus:       'bg-lime-500/15 text-lime-400',
}

const STATUS_COLORS: Record<string, string> = {
  completed:  'bg-emerald-500/15 text-emerald-400',
  pending:    'bg-amber-500/15 text-amber-400',
  failed:     'bg-red-500/15 text-red-400',
  cancelled:  'bg-gray-500/15 text-gray-400',
  processing: 'bg-blue-500/15 text-blue-400',
  rejected:   'bg-red-500/15 text-red-400',
}

const TABS = [
  { key: 'transactions', label: 'Transactions' },
  { key: 'withdrawals', label: 'Retraits' },
]

const TX_TYPES = Object.keys(TX_TYPE_LABELS)

function KpiCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-400">{label}</p>
        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', color)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

export function FinancePage() {
  const [tab, setTab] = useState<'transactions' | 'withdrawals'>('transactions')
  const [txPage, setTxPage] = useState(1)
  const [txType, setTxType] = useState('')
  const [txStatus, setTxStatus] = useState('')
  const [wPage, setWPage] = useState(1)
  const [wStatus, setWStatus] = useState('')

  const { data: overview, isLoading: ovLoading } = useQuery({
    queryKey: ['finance-overview'],
    queryFn: financeService.getOverview,
    staleTime: 60_000,
  })

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['finance-transactions', txPage, txType, txStatus],
    queryFn: () => financeService.getTransactions(txPage, 50, txType || undefined, txStatus || undefined),
    enabled: tab === 'transactions',
  })

  const { data: withdrawals, isLoading: wLoading } = useQuery({
    queryKey: ['finance-withdrawals', wPage, wStatus],
    queryFn: () => financeService.getWithdrawals(wPage, 50, wStatus || undefined),
    enabled: tab === 'withdrawals',
  })

  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtCoins = (n: number) => n.toLocaleString('fr-FR')

  const monthTrend = overview
    ? overview.revenue.last_month_eur > 0
      ? ((overview.revenue.this_month_eur - overview.revenue.last_month_eur) / overview.revenue.last_month_eur) * 100
      : null
    : null

  return (
    <div className="space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Revenus totaux"
          value={ovLoading ? '…' : `${fmt(overview?.revenue.total_eur ?? 0)} €`}
          sub={overview ? `Ce mois : ${fmt(overview.revenue.this_month_eur)} €` : undefined}
          icon={TrendingUp}
          color="bg-emerald-500/20 text-emerald-400"
        />
        <KpiCard
          label="Paiements Stripe"
          value={ovLoading ? '…' : `${fmt(overview?.payments.total_eur ?? 0)} €`}
          sub={overview ? `Ce mois : ${fmt(overview.payments.this_month_eur)} €` : undefined}
          icon={CreditCard}
          color="bg-violet-500/20 text-violet-400"
        />
        <KpiCard
          label="Retraits versés"
          value={ovLoading ? '…' : `${fmt(overview?.withdrawals.total_paid_eur ?? 0)} €`}
          sub={overview ? `${overview.withdrawals.pending_count} en attente` : undefined}
          icon={ArrowDownCircle}
          color="bg-orange-500/20 text-orange-400"
        />
        <KpiCard
          label="Abonnements actifs"
          value={ovLoading ? '…' : String(overview?.subscriptions.active_count ?? 0)}
          sub={monthTrend !== null ? `${monthTrend > 0 ? '+' : ''}${monthTrend.toFixed(1)}% vs mois dernier` : undefined}
          icon={Users}
          color="bg-blue-500/20 text-blue-400"
        />
      </div>

      {/* Breakdown par type */}
      {overview && overview.transaction_breakdown.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Répartition par type de transaction</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {overview.transaction_breakdown
              .sort((a, b) => b.count - a.count)
              .map(t => (
                <div key={t.type} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-800/60">
                  <div className="min-w-0">
                    <span className={clsx('badge text-xs', TX_TYPE_COLORS[t.type] ?? 'bg-gray-700 text-gray-300')}>
                      {TX_TYPE_LABELS[t.type] ?? t.type}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{fmtCoins(t.count)} opération{t.count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-xs font-medium text-gray-200">{fmtCoins(t.coins)} C</p>
                    {t.eur > 0 && <p className="text-xs text-gray-500">{fmt(t.eur)} €</p>}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              tab === t.key
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Transactions */}
      {tab === 'transactions' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <select className="input w-48 text-sm" value={txType} onChange={e => { setTxType(e.target.value); setTxPage(1) }}>
              <option value="">Tous les types</option>
              {TX_TYPES.map(t => <option key={t} value={t}>{TX_TYPE_LABELS[t]}</option>)}
            </select>
            <select className="input w-40 text-sm" value={txStatus} onChange={e => { setTxStatus(e.target.value); setTxPage(1) }}>
              <option value="">Tous les statuts</option>
              <option value="completed">Complété</option>
              <option value="pending">En attente</option>
              <option value="failed">Échoué</option>
              <option value="cancelled">Annulé</option>
            </select>
            {transactions && <p className="text-xs text-gray-500 self-center ml-auto">{transactions.total.toLocaleString('fr-FR')} transaction{transactions.total !== 1 ? 's' : ''}</p>}
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-left">
                    <th className="px-4 py-3 text-gray-400 font-medium">Utilisateur</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Type</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Statut</th>
                    <th className="px-4 py-3 text-gray-400 font-medium text-right">Coins</th>
                    <th className="px-4 py-3 text-gray-400 font-medium text-right">EUR</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Description</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {txLoading ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-800 rounded w-2/3" /></td>
                    </tr>
                  )) : (transactions?.items ?? []).length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">Aucune transaction</td></tr>
                  ) : (transactions?.items ?? []).map(tx => (
                    <tr key={tx.id} className="table-row-hover">
                      <td className="px-4 py-3">
                        <p className="text-gray-200 text-xs font-medium truncate max-w-[160px]">{tx.user.name}</p>
                        <p className="text-gray-500 text-xs truncate max-w-[160px]">{tx.user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('badge text-xs', TX_TYPE_COLORS[tx.type] ?? 'bg-gray-700 text-gray-300')}>
                          {TX_TYPE_LABELS[tx.type] ?? tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('badge text-xs', STATUS_COLORS[tx.status] ?? 'bg-gray-700 text-gray-300')}>
                          {tx.status}
                        </span>
                      </td>
                      <td className={clsx('px-4 py-3 text-right font-mono text-xs', tx.coins_amount >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                        {tx.coins_amount >= 0 ? '+' : ''}{fmtCoins(tx.coins_amount)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300 text-xs font-mono">
                        {tx.eur_amount != null ? `${fmt(tx.eur_amount)} €` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px] truncate">
                        {tx.description ?? tx.reference_type ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {transactions && transactions.total > 50 && (
              <div className="px-4 py-3 border-t border-gray-800 flex items-center gap-2 justify-end">
                <button disabled={txPage <= 1} onClick={() => setTxPage(p => p - 1)} className="btn-ghost py-1 px-3 text-xs disabled:opacity-40">Précédent</button>
                <span className="text-xs text-gray-500">{txPage} / {Math.ceil(transactions.total / 50)}</span>
                <button disabled={txPage >= Math.ceil(transactions.total / 50)} onClick={() => setTxPage(p => p + 1)} className="btn-ghost py-1 px-3 text-xs disabled:opacity-40">Suivant</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Retraits */}
      {tab === 'withdrawals' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <select className="input w-40 text-sm" value={wStatus} onChange={e => { setWStatus(e.target.value); setWPage(1) }}>
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="processing">En cours</option>
              <option value="completed">Complété</option>
              <option value="rejected">Rejeté</option>
            </select>
            {withdrawals && <p className="text-xs text-gray-500 self-center ml-auto">{withdrawals.total} retrait{withdrawals.total !== 1 ? 's' : ''}</p>}
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-left">
                    <th className="px-4 py-3 text-gray-400 font-medium">Utilisateur</th>
                    <th className="px-4 py-3 text-gray-400 font-medium text-right">Coins</th>
                    <th className="px-4 py-3 text-gray-400 font-medium text-right">Montant</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Méthode</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Statut</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Note admin</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {wLoading ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-800 rounded w-2/3" /></td>
                    </tr>
                  )) : (withdrawals?.items ?? []).length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">Aucun retrait</td></tr>
                  ) : (withdrawals?.items ?? []).map(w => (
                    <tr key={w.id} className="table-row-hover">
                      <td className="px-4 py-3">
                        <p className="text-gray-200 text-xs font-medium">{w.user.name}</p>
                        <p className="text-gray-500 text-xs">{w.user.email}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-orange-400 font-mono text-xs">{fmtCoins(w.coins_amount)}</td>
                      <td className="px-4 py-3 text-right text-gray-200 font-mono text-xs">{fmt(w.eur_amount)} €</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{w.payout_method ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('badge text-xs', STATUS_COLORS[w.status] ?? 'bg-gray-700 text-gray-300')}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate">{w.admin_note ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {new Date(w.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {withdrawals && withdrawals.total > 50 && (
              <div className="px-4 py-3 border-t border-gray-800 flex items-center gap-2 justify-end">
                <button disabled={wPage <= 1} onClick={() => setWPage(p => p - 1)} className="btn-ghost py-1 px-3 text-xs disabled:opacity-40">Précédent</button>
                <span className="text-xs text-gray-500">{wPage} / {Math.ceil(withdrawals.total / 50)}</span>
                <button disabled={wPage >= Math.ceil(withdrawals.total / 50)} onClick={() => setWPage(p => p + 1)} className="btn-ghost py-1 px-3 text-xs disabled:opacity-40">Suivant</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
