import { useState, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { financeService, TransactionDetail, RevenueData } from '@/services/finance.service'
import { TrendingUp, TrendingDown, Wallet, Users, ArrowDownCircle, CreditCard, Search, X, ChevronRight, Copy, Check, ExternalLink, Lock, Eye, EyeOff, Building2, AlertTriangle } from 'lucide-react'
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
  { key: 'withdrawals',  label: 'Retraits' },
  { key: 'revenue',      label: 'Revenus entreprise' },
]

const TX_TYPES = Object.keys(TX_TYPE_LABELS)

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="ml-1.5 text-gray-500 hover:text-gray-300 transition-colors"
      title="Copier"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  )
}

function DetailRow({ label, value, mono = false, children }: { label: string; value?: string | null; mono?: boolean; children?: React.ReactNode }) {
  if (value == null && !children) return null
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-800 last:border-0">
      <span className="text-xs text-gray-500 shrink-0 w-36">{label}</span>
      <span className={clsx('text-xs text-right break-all', mono ? 'font-mono text-gray-300' : 'text-gray-200')}>
        {children ?? value}
      </span>
    </div>
  )
}

function TransactionDrawer({ txId, onClose }: { txId: string; onClose: () => void }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['finance-tx-detail', txId],
    queryFn: () => financeService.getTransactionDetail(txId),
    staleTime: 30_000,
  })

  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-[420px] bg-gray-900 border-l border-gray-800 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-sm font-semibold text-white">Détail de la transaction</h2>
            {data && (
              <p className="text-xs text-gray-500 font-mono mt-0.5 flex items-center gap-1">
                {data.id}
                <CopyButton text={data.id} />
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading && (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-8 bg-gray-800 rounded" />
              ))}
            </div>
          )}

          {isError && (
            <div className="py-12 text-center text-red-400 text-sm">Transaction introuvable</div>
          )}

          {data && (
            <div className="space-y-5">
              {/* Status banner */}
              <div className={clsx(
                'rounded-xl px-4 py-3 flex items-center justify-between',
                data.status === 'completed' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                data.status === 'pending'   ? 'bg-amber-500/10 border border-amber-500/20' :
                data.status === 'failed'    ? 'bg-red-500/10 border border-red-500/20' :
                'bg-gray-800 border border-gray-700'
              )}>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Montant</p>
                  <p className={clsx('text-2xl font-bold', data.coins_amount >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {data.coins_amount >= 0 ? '+' : ''}{data.coins_amount.toLocaleString('fr-FR')} coins
                  </p>
                  {data.eur_amount != null && (
                    <p className="text-xs text-gray-400 mt-0.5">{fmt(data.eur_amount)} €</p>
                  )}
                </div>
                <span className={clsx('badge text-xs', STATUS_COLORS[data.status] ?? 'bg-gray-700 text-gray-300')}>
                  {data.status}
                </span>
              </div>

              {/* Type */}
              <div className="flex items-center gap-2">
                <span className={clsx('badge text-xs', TX_TYPE_COLORS[data.type] ?? 'bg-gray-700 text-gray-300')}>
                  {TX_TYPE_LABELS[data.type] ?? data.type}
                </span>
              </div>

              {/* Utilisateur */}
              <div className="card p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Utilisateur</p>
                <DetailRow label="Nom" value={data.user.name} />
                <DetailRow label="Email" value={data.user.email} />
                {data.user.username && <DetailRow label="Username" value={`@${data.user.username}`} />}
                {data.user.id && (
                  <DetailRow label="User ID" mono>
                    <span className="flex items-center gap-1">
                      {data.user.id.slice(0, 18)}…
                      <CopyButton text={data.user.id} />
                    </span>
                  </DetailRow>
                )}
              </div>

              {/* Transaction details */}
              <div className="card p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Transaction</p>
                <DetailRow label="ID transaction" mono>
                  <span className="flex items-center gap-1">
                    {data.id}
                    <CopyButton text={data.id} />
                  </span>
                </DetailRow>
                <DetailRow label="Solde après" value={data.balance_after != null ? `${data.balance_after.toLocaleString('fr-FR')} coins` : null} />
                {data.description && <DetailRow label="Description" value={data.description} />}
                {data.reference_type && <DetailRow label="Ref. type" value={data.reference_type} mono />}
                {data.reference_id && (
                  <DetailRow label="Ref. ID" mono>
                    <span className="flex items-center gap-1">
                      {data.reference_id.slice(0, 18)}…
                      <CopyButton text={data.reference_id} />
                    </span>
                  </DetailRow>
                )}
                <DetailRow label="Créée le" value={new Date(data.created_at).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'medium' })} />
                {data.updated_at && data.updated_at !== data.created_at && (
                  <DetailRow label="Mise à jour" value={new Date(data.updated_at).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'medium' })} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratuit', basic: 'Basic', premium: 'Premium', family: 'Famille',
}

function RevenueSection() {
  const [token, setToken]       = useState<string | null>(() => sessionStorage.getItem('revenue_token'))
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const unlock = useMutation({
    mutationFn: () => financeService.unlockRevenue(password),
    onSuccess: (t) => {
      sessionStorage.setItem('revenue_token', t)
      setToken(t)
      setPassword('')
      setError('')
    },
    onError: () => setError('Mot de passe incorrect'),
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['finance-revenue', token],
    queryFn: () => financeService.getRevenue(token!),
    enabled: !!token,
    retry: false,
    onError: () => { sessionStorage.removeItem('revenue_token'); setToken(null) },
  })

  const fmt  = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k €` : `${fmt(n)} €`

  // ── Verrouillé ───────────────────────────────────────────────────────────────
  if (!token || isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Lock className="w-8 h-8 text-amber-400" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold text-white mb-1">Accès restreint</h3>
          <p className="text-sm text-gray-400 max-w-xs">
            Cette section contient les revenus confidentiels de l'entreprise.<br />
            Saisissez le mot de passe pour continuer.
          </p>
        </div>

        <form
          className="w-full max-w-sm space-y-3"
          onSubmit={e => { e.preventDefault(); unlock.mutate() }}
        >
          <div className="relative">
            <input
              ref={inputRef}
              type={showPwd ? 'text' : 'password'}
              className="input w-full pr-10 text-sm"
              placeholder="Mot de passe revenus"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              autoFocus
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              onClick={() => setShowPwd(v => !v)}
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
            </p>
          )}
          <button
            type="submit"
            disabled={!password || unlock.isPending}
            className="btn-primary w-full justify-center"
          >
            {unlock.isPending ? 'Vérification…' : 'Déverrouiller'}
          </button>
        </form>
      </div>
    )
  }

  // ── Chargement ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card h-24 bg-gray-800" />
        ))}
      </div>
    )
  }

  if (!data) return null

  const margin = data.gross_revenue.total_eur > 0
    ? ((data.net_revenue_eur / data.gross_revenue.total_eur) * 100).toFixed(1)
    : '0.0'

  const maxMonth = Math.max(...data.monthly_trend.map(m => m.eur), 1)

  return (
    <div className="space-y-6">
      {/* Bouton verrouiller */}
      <div className="flex justify-end">
        <button
          onClick={() => { sessionStorage.removeItem('revenue_token'); setToken(null) }}
          className="btn-ghost text-xs flex items-center gap-1.5 text-amber-400 hover:text-amber-300"
        >
          <Lock className="w-3.5 h-3.5" /> Verrouiller
        </button>
      </div>

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Revenu brut total',   value: `${fmt(data.gross_revenue.total_eur)} €`,     sub: `Ce mois : ${fmt(data.gross_revenue.this_month_eur)} €`,  color: 'bg-emerald-500/20 text-emerald-400', icon: TrendingUp },
          { label: 'Revenu net estimé',   value: `${fmt(data.net_revenue_eur)} €`,             sub: `Marge : ${margin}%`,                                     color: 'bg-violet-500/20 text-violet-400',  icon: Building2 },
          { label: 'Cette année',         value: `${fmt(data.gross_revenue.this_year_eur)} €`, sub: undefined,                                                color: 'bg-blue-500/20 text-blue-400',      icon: TrendingUp },
          { label: 'Ventes coins',        value: `${fmt(data.gross_revenue.coins_total_eur)} €`, sub: undefined,                                              color: 'bg-amber-500/20 text-amber-400',    icon: CreditCard },
          { label: 'Paiements Stripe',    value: `${fmt(data.gross_revenue.stripe_total_eur)} €`, sub: undefined,                                             color: 'bg-cyan-500/20 text-cyan-400',      icon: CreditCard },
          { label: 'Retraits versés',     value: `${fmt(data.charges.withdrawals_paid_eur)} €`, sub: `En attente : ${fmt(data.charges.withdrawals_pending_eur)} €`, color: 'bg-orange-500/20 text-orange-400', icon: ArrowDownCircle },
        ].map(({ label, value, sub, color, icon: Icon }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-sm text-gray-400">{label}</p>
              <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', color)}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Abonnements par plan */}
      {data.subscriptions.by_plan.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-4">
            Abonnements actifs — {data.subscriptions.active_count} total
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.subscriptions.by_plan.map(p => (
              <div key={p.plan} className="rounded-xl bg-gray-800/60 px-4 py-3 text-center">
                <p className="text-xl font-bold text-white">{p.count}</p>
                <p className="text-xs text-gray-400 mt-1">{PLAN_LABELS[p.plan] ?? p.plan}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Courbe mensuelle */}
      {data.monthly_trend.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Revenus mensuels (12 derniers mois)</h3>
          <div className="flex items-end gap-1.5 h-32">
            {data.monthly_trend.map(m => {
              const height = Math.max((m.eur / maxMonth) * 100, 2)
              return (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full rounded-t-md bg-violet-500/40 group-hover:bg-violet-400/60 transition-colors"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[9px] text-gray-600 group-hover:text-gray-400 transition-colors">
                    {m.label.slice(2)}
                  </span>
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap shadow-xl">
                      <p className="font-semibold text-white">{fmt(m.eur)} €</p>
                      <p className="text-gray-400">{m.count} transactions</p>
                    </div>
                    <div className="w-2 h-2 bg-gray-800 border-r border-b border-gray-700 rotate-45 -mt-1" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

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
  const [txSearch, setTxSearch] = useState('')
  const [txSearchInput, setTxSearchInput] = useState('')
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null)
  const [wPage, setWPage] = useState(1)
  const [wStatus, setWStatus] = useState('')

  const { data: overview, isLoading: ovLoading } = useQuery({
    queryKey: ['finance-overview'],
    queryFn: financeService.getOverview,
    staleTime: 60_000,
  })

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['finance-transactions', txPage, txType, txStatus, txSearch],
    queryFn: () => financeService.getTransactions(txPage, 50, txType || undefined, txStatus || undefined, txSearch || undefined),
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
      {selectedTxId && (
        <TransactionDrawer txId={selectedTxId} onClose={() => setSelectedTxId(null)} />
      )}

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
              'px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5',
              tab === t.key && t.key === 'revenue'
                ? 'border-amber-500 text-amber-400'
                : tab === t.key
                  ? 'border-violet-500 text-violet-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
            )}
          >
            {t.key === 'revenue' && <Lock className="w-3 h-3" />}
            {t.label}
          </button>
        ))}
      </div>

      {/* Transactions */}
      {tab === 'transactions' && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {/* Recherche par ID de transaction */}
            <form
              className="flex items-center gap-1"
              onSubmit={e => { e.preventDefault(); setTxSearch(txSearchInput.trim()); setTxPage(1) }}
            >
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                <input
                  className="input pl-8 pr-8 w-72 text-sm font-mono"
                  placeholder="Ex: TXN-2505-A3K9F2"
                  value={txSearchInput}
                  onChange={e => setTxSearchInput(e.target.value)}
                />
                {txSearchInput && (
                  <button type="button" onClick={() => { setTxSearchInput(''); setTxSearch(''); setTxPage(1) }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button type="submit" className="btn-ghost py-1.5 px-3 text-xs">Chercher</button>
            </form>

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
            {txSearch && (
              <span className="self-center text-xs bg-violet-500/20 text-violet-400 px-2 py-1 rounded-md font-mono">
                ID: {txSearch.slice(0, 8)}…
              </span>
            )}
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
                    <th className="px-2 py-3" />
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
                    <tr
                      key={tx.id}
                      className={clsx('table-row-hover cursor-pointer', txSearch && transactions?.total === 1 && 'bg-violet-500/5 ring-1 ring-inset ring-violet-500/30')}
                      onClick={() => setSelectedTxId(tx.id)}
                    >
                      <td className="px-4 py-3">
                        <p className="text-gray-200 text-xs font-medium truncate max-w-[160px]">{tx.user.name}</p>
                        <p className="text-gray-500 text-xs truncate max-w-[160px]">{tx.user.email}</p>
                        <p className="text-gray-600 text-[10px] font-mono mt-0.5">{tx.id}</p>
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
                      <td className="px-2 py-3 text-gray-600">
                        <ChevronRight className="w-3.5 h-3.5" />
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

      {/* Revenus entreprise */}
      {tab === 'revenue' && <RevenueSection />}

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
