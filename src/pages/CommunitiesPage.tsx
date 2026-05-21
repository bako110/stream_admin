import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import {
  Users, Search, RefreshCw, BadgeCheck, Lock, Unlock,
  Calendar, X, Shield, User, Zap, Trash2, Ban, ShieldOff,
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
  is_blocked?: boolean
  creator_id: string
  creator: {
    id: string
    username: string | null
    display_name: string | null
    avatar_url: string | null
  } | null
  created_at: string
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

type ConfirmAction = { type: 'delete' | 'block' | 'unblock'; community: Community }

export function CommunitiesPage() {
  const qc = useQueryClient()
  const { user: me } = useAuth()
  const isAdmin = me?.role === 'admin'
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Community | null>(null)
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null)

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

  const mutDelete = useMutation({
    mutationFn: (id: string) => api.delete(`/communities/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-communities'] })
      setSelected(null)
      setConfirm(null)
    },
  })

  const mutBlock = useMutation({
    mutationFn: ({ id, block }: { id: string; block: boolean }) =>
      api.post(`/communities/${id}/${block ? 'block' : 'unblock'}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-communities'] })
      qc.invalidateQueries({ queryKey: ['admin-community-detail', selected?.id] })
      setConfirm(null)
    },
  })

  function handleConfirm() {
    if (!confirm) return
    if (confirm.type === 'delete') mutDelete.mutate(confirm.community.id)
    else if (confirm.type === 'block') mutBlock.mutate({ id: confirm.community.id, block: true })
    else if (confirm.type === 'unblock') mutBlock.mutate({ id: confirm.community.id, block: false })
  }

  const acting = mutDelete.isPending || mutBlock.isPending
  const target = detail ?? selected

  return (
    <div className="flex gap-5 h-[calc(100vh-4rem)]">

      {/* ── Liste ── */}
      <div className={clsx('flex flex-col gap-4 overflow-hidden', selected ? 'w-96 shrink-0' : 'flex-1')}>
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
          <button onClick={() => refetch()} className="btn-ghost p-2"><RefreshCw className="w-4 h-4" /></button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            className="input pl-9 w-full"
            placeholder="Rechercher une communauté…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

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
                  selected?.id === c.id && 'ring-1 ring-violet-500/50 bg-violet-500/5',
                  c.is_blocked && 'opacity-50',
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
                    {c.is_blocked && <Ban className="w-3 h-3 text-red-400 shrink-0" />}
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">{c.members_count} membres · {fmtDate(c.created_at)}</p>
                </div>
                {(c.entry_price_coins ?? 0) > 0 && (
                  <span className="badge bg-yellow-500/15 text-yellow-400 text-xs shrink-0 flex items-center gap-0.5">
                    {c.entry_price_coins} <Zap className="w-2.5 h-2.5" />
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Détail ── */}
      {selected && (
        <div className="flex-1 overflow-y-auto space-y-5 pb-10">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Détail</h3>
            <button onClick={() => setSelected(null)} className="btn-ghost p-2"><X className="w-4 h-4" /></button>
          </div>

          {detailLoading ? (
            <div className="card p-8 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-gray-500 animate-spin" />
            </div>
          ) : target ? (
            <>
              {/* Banner + Avatar */}
              <div className="card overflow-hidden">
                {target.banner_url ? (
                  <img src={target.banner_url} className="w-full h-24 object-cover" />
                ) : (
                  <div className="w-full h-24 bg-gradient-to-r from-violet-900/60 to-sky-900/60" />
                )}
                <div className="px-5 pb-5 -mt-6 flex items-end gap-4">
                  {target.avatar_url ? (
                    <img src={target.avatar_url} className="w-14 h-14 rounded-xl object-cover border-2 border-gray-900 shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-violet-600/30 border-2 border-gray-900 flex items-center justify-center shrink-0">
                      <Users className="w-6 h-6 text-violet-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 pt-7">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-bold text-lg truncate">{target.name}</span>
                      {target.is_verified && (
                        <span className="badge bg-sky-500/15 text-sky-400 flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3" /> Vérifiée
                        </span>
                      )}
                      {target.is_blocked && (
                        <span className="badge bg-red-500/15 text-red-400 flex items-center gap-1">
                          <Ban className="w-3 h-3" /> Bloquée
                        </span>
                      )}
                      {target.is_private ? (
                        <span className="badge bg-gray-700 text-gray-300 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Privée
                        </span>
                      ) : (
                        <span className="badge bg-emerald-500/15 text-emerald-400 flex items-center gap-1">
                          <Unlock className="w-3 h-3" /> Publique
                        </span>
                      )}
                    </div>
                    {target.description && (
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">{target.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={<Users className="w-4 h-4 text-violet-400" />} label="Membres" value={target.members_count.toLocaleString()} color="violet" />
                <StatCard icon={<Calendar className="w-4 h-4 text-sky-400" />} label="Créée le" value={fmtDate(target.created_at)} color="sky" />
                <StatCard icon={<Zap className="w-4 h-4 text-yellow-400" />} label="Accès (coins)" value={(target.entry_price_coins ?? 0) === 0 ? 'Gratuit' : `${target.entry_price_coins} coins`} color="yellow" />
                <StatCard icon={<Shield className="w-4 h-4 text-emerald-400" />} label="Approbation" value={target.requires_approval ? 'Requise' : 'Auto'} color="emerald" />
              </div>

              {/* Paramètres */}
              <div className="card p-5 space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Paramètres</p>
                <div className="space-y-2">
                  <SettingRow label="Chat membres uniquement" value={target.members_only_chat} />
                  <SettingRow label="Approbation requise" value={target.requires_approval} />
                  <SettingRow label="Communauté privée" value={target.is_private} />
                  <SettingRow label="Badge vérifiée" value={target.is_verified} />
                  {target.is_verified && target.verified_at && (
                    <p className="text-xs text-gray-500 pl-1">Vérifiée le {fmtDate(target.verified_at)}</p>
                  )}
                </div>
              </div>

              {/* Créateur */}
              {target.creator && (
                <div className="card p-5">
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Créateur</p>
                  <div className="flex items-center gap-3">
                    {target.creator.avatar_url ? (
                      <img src={target.creator.avatar_url} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-violet-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium text-sm">
                        {target.creator.display_name ?? target.creator.username ?? '—'}
                      </p>
                      {target.creator.username && (
                        <p className="text-gray-500 text-xs">@{target.creator.username}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions admin */}
              <div className="card p-5 space-y-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Actions admin</p>
                <div className="flex flex-col gap-2">
                  {target.is_blocked ? (
                    <button
                      onClick={() => setConfirm({ type: 'unblock', community: target })}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 text-sm font-medium transition-colors border border-emerald-500/20"
                    >
                      <ShieldOff className="w-4 h-4" />
                      Débloquer la communauté
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirm({ type: 'block', community: target })}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-orange-600/15 hover:bg-orange-600/25 text-orange-400 text-sm font-medium transition-colors border border-orange-500/20"
                    >
                      <Ban className="w-4 h-4" />
                      Bloquer la communauté
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => setConfirm({ type: 'delete', community: target })}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600/15 hover:bg-red-600/25 text-red-400 text-sm font-medium transition-colors border border-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer définitivement
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ── Dialog confirmation ── */}
      {confirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', {
                'bg-red-500/15': confirm.type === 'delete',
                'bg-orange-500/15': confirm.type === 'block',
                'bg-emerald-500/15': confirm.type === 'unblock',
              })}>
                {confirm.type === 'delete' && <Trash2 className="w-5 h-5 text-red-400" />}
                {confirm.type === 'block' && <Ban className="w-5 h-5 text-orange-400" />}
                {confirm.type === 'unblock' && <ShieldOff className="w-5 h-5 text-emerald-400" />}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">
                  {confirm.type === 'delete' && 'Supprimer la communauté'}
                  {confirm.type === 'block' && 'Bloquer la communauté'}
                  {confirm.type === 'unblock' && 'Débloquer la communauté'}
                </p>
                <p className="text-gray-400 text-xs mt-0.5">« {confirm.community.name} »</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              {confirm.type === 'delete' && 'Cette action est irréversible. Tous les messages, membres et données seront supprimés.'}
              {confirm.type === 'block' && 'La communauté sera inaccessible pour tous ses membres.'}
              {confirm.type === 'unblock' && 'La communauté redeviendra accessible à ses membres.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                disabled={acting}
                className="flex-1 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={acting}
                className={clsx('flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50', {
                  'bg-red-600 hover:bg-red-500': confirm.type === 'delete',
                  'bg-orange-600 hover:bg-orange-500': confirm.type === 'block',
                  'bg-emerald-600 hover:bg-emerald-500': confirm.type === 'unblock',
                })}
              >
                {acting ? '…' : confirm.type === 'delete' ? 'Supprimer' : confirm.type === 'block' ? 'Bloquer' : 'Débloquer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const bg: Record<string, string> = {
    violet: 'bg-violet-500/10', sky: 'bg-sky-500/10', yellow: 'bg-yellow-500/10', emerald: 'bg-emerald-500/10',
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
