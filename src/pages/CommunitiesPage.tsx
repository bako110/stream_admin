import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import {
  Users, Search, RefreshCw, BadgeCheck, Lock, Unlock,
  DollarSign, MessageSquare, Calendar, X, TrendingUp,
  Shield, User, Zap,
} from 'lucide-react'
import clsx from 'clsx'

interface Community {
  id: string
  name: string
  description: string | null
  avatar_url: string | null
  banner_url: string | null
  is_private: boolean
  requires_approval: boolean
  members_only_chat: boolean
  entry_price_coins: number
  is_verified: boolean
  verified_at: string | null
  members_count: number
  creator_id: string
  creator: {
    id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
    email?: string
  } | null
  created_at: string
  join_status?: string
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function fetchCommunities(search: string): Promise<Community[]> {
  const params: Record<string, string> = { limit: '100' }
  if (search) params.q = search
  const { data } = await api.get<Community[]>('/communities', { params })
  return Array.isArray(data) ? data : (data as any)?.items ?? []
}

async function fetchCommunityDetail(id: string): Promise<Community> {
  const { data } = await api.get<Community>(`/communities/${id}`)
  return data
}

export function CommunitiesPage() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Community | null>(null)

  const { data: communities = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-communities', search],
    queryFn: () => fetchCommunities(search),
    staleTime: 20_000,
  })

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-community-detail', selected?.id],
    queryFn: () => fetchCommunityDetail(selected!.id),
    enabled: !!selected,
  })

  return (
    <div className="flex gap-5 h-[calc(100vh-4rem)]">
      {/* ── Liste ── */}
      <div className={clsx('flex flex-col gap-4 overflow-hidden', selected ? 'w-96 shrink-0' : 'flex-1')}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Communautés</h2>
              <p className="text-xs text-gray-500">{communities.length} communauté{communities.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={() => refetch()} className="btn-ghost p-2">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            className="input pl-9 w-full"
            placeholder="Rechercher une communauté…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-4 animate-pulse flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-2/3" />
                  <div className="h-3 bg-gray-800 rounded w-1/3" />
                </div>
              </div>
            ))
          ) : communities.length === 0 ? (
            <div className="card p-10 flex flex-col items-center gap-2 text-center">
              <Users className="w-8 h-8 text-gray-600" />
              <p className="text-gray-400">Aucune communauté</p>
            </div>
          ) : (
            communities.map(c => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className={clsx(
                  'card w-full flex items-center gap-3 p-4 text-left transition-all hover:bg-gray-800/60',
                  selected?.id === c.id && 'ring-1 ring-violet-500/50 bg-violet-500/5'
                )}
              >
                {c.avatar_url ? (
                  <img src={c.avatar_url} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-violet-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-white font-medium text-sm truncate">{c.name}</span>
                    {c.is_verified && <BadgeCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                    {c.is_private && <Lock className="w-3 h-3 text-gray-500 shrink-0" />}
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">{c.members_count} membres · {fmtDate(c.created_at)}</p>
                </div>
                {(c.entry_price_coins ?? 0) > 0 && (
                  <span className="badge bg-yellow-500/15 text-yellow-400 text-xs shrink-0">
                    {c.entry_price_coins} <Zap className="w-2.5 h-2.5 inline" />
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Détail ── */}
      {selected && (
        <div className="flex-1 overflow-y-auto space-y-5">
          {/* Header détail */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Détail</h3>
            <button onClick={() => setSelected(null)} className="btn-ghost p-2">
              <X className="w-4 h-4" />
            </button>
          </div>

          {detailLoading ? (
            <div className="card p-8 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
            </div>
          ) : detail ? (
            <>
              {/* Banner + Avatar */}
              <div className="card overflow-hidden">
                {detail.banner_url ? (
                  <img src={detail.banner_url} className="w-full h-24 object-cover" />
                ) : (
                  <div className="w-full h-24 bg-gradient-to-r from-violet-900/60 to-sky-900/60" />
                )}
                <div className="px-5 pb-5 -mt-6 flex items-end gap-4">
                  {detail.avatar_url ? (
                    <img src={detail.avatar_url} className="w-14 h-14 rounded-xl object-cover border-2 border-gray-900 shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-violet-600/30 border-2 border-gray-900 flex items-center justify-center shrink-0">
                      <Users className="w-6 h-6 text-violet-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 pt-7">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-bold text-lg truncate">{detail.name}</span>
                      {detail.is_verified && (
                        <span className="badge bg-sky-500/15 text-sky-400 flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3" /> Vérifiée
                        </span>
                      )}
                      {detail.is_private ? (
                        <span className="badge bg-gray-700 text-gray-300 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Privée
                        </span>
                      ) : (
                        <span className="badge bg-emerald-500/15 text-emerald-400 flex items-center gap-1">
                          <Unlock className="w-3 h-3" /> Publique
                        </span>
                      )}
                    </div>
                    {detail.description && (
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{detail.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={<Users className="w-4 h-4 text-violet-400" />} label="Membres" value={detail.members_count.toLocaleString()} color="violet" />
                <StatCard icon={<Calendar className="w-4 h-4 text-sky-400" />} label="Créée le" value={fmtDate(detail.created_at)} color="sky" />
                <StatCard icon={<Zap className="w-4 h-4 text-yellow-400" />} label="Accès (coins)" value={(detail.entry_price_coins ?? 0) === 0 ? 'Gratuit' : `${detail.entry_price_coins} coins`} color="yellow" />
                <StatCard icon={<Shield className="w-4 h-4 text-emerald-400" />} label="Approbation" value={detail.requires_approval ? 'Requise' : 'Auto'} color="emerald" />
              </div>

              {/* Paramètres */}
              <div className="card p-5 space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Paramètres</p>
                <div className="space-y-2">
                  <SettingRow label="Chat membres uniquement" value={detail.members_only_chat} />
                  <SettingRow label="Approbation requise" value={detail.requires_approval} />
                  <SettingRow label="Communauté privée" value={detail.is_private} />
                  <SettingRow label="Badge vérifiée" value={detail.is_verified} />
                  {detail.is_verified && detail.verified_at && (
                    <p className="text-xs text-gray-500 pl-1">Vérifiée le {fmtDate(detail.verified_at)}</p>
                  )}
                </div>
              </div>

              {/* Créateur */}
              {detail.creator && (
                <div className="card p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Créateur</p>
                  <div className="flex items-center gap-3">
                    {detail.creator.avatar_url ? (
                      <img src={detail.creator.avatar_url} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-violet-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium text-sm">
                        {detail.creator.display_name ?? detail.creator.username ?? '—'}
                      </p>
                      {detail.creator.username && (
                        <p className="text-gray-500 text-xs">@{detail.creator.username}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const bg: Record<string, string> = {
    violet: 'bg-violet-500/10',
    sky: 'bg-sky-500/10',
    yellow: 'bg-yellow-500/10',
    emerald: 'bg-emerald-500/10',
  }
  return (
    <div className={clsx('card p-4 flex items-center gap-3', bg[color])}>
      <div className="shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-white font-semibold text-sm">{value}</p>
      </div>
    </div>
  )
}

function SettingRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-300">{label}</span>
      <span className={clsx('badge text-xs', value ? 'bg-emerald-500/15 text-emerald-400' : 'bg-gray-700 text-gray-400')}>
        {value ? 'Oui' : 'Non'}
      </span>
    </div>
  )
}
