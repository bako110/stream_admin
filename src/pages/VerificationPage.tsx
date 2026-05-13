import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersService } from '@/services/users.service'
import type { CommunityVerifRequest } from '@/services/users.service'
import { BadgeCheck, CheckCircle, XCircle, Clock, RefreshCw, User, Users, Zap } from 'lucide-react'
import type { User as UserType } from '@/types'
import clsx from 'clsx'

type Tab = 'users' | 'communities'

export function VerificationPage() {
  const [tab, setTab] = useState<Tab>('users')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-sky-500/15 flex items-center justify-center">
          <BadgeCheck className="w-5 h-5 text-sky-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">Demandes de vérification</h2>
          <p className="text-xs text-gray-500">Badges officiels FoliX</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 p-1 bg-gray-800/60 rounded-xl w-fit">
        <button
          onClick={() => setTab('users')}
          className={clsx('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors', tab === 'users' ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-gray-200')}
        >
          <User className="w-4 h-4" /> Utilisateurs
        </button>
        <button
          onClick={() => setTab('communities')}
          className={clsx('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors', tab === 'communities' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200')}
        >
          <Users className="w-4 h-4" /> Communautés
        </button>
      </div>

      {tab === 'users' ? <UsersVerifTab /> : <CommunitiesVerifTab />}
    </div>
  )
}

// ── Onglet Utilisateurs (code original) ──────────────────────────────────────

function UsersVerifTab() {
  const qc = useQueryClient()
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['verification-pending'],
    queryFn: () => usersService.listPendingVerification(),
    refetchInterval: 30_000,
  })

  const pending = users.filter(u => u.verification_status === 'pending')

  const mutReview = useMutation({
    mutationFn: ({ userId, action, note }: { userId: string; action: 'approve' | 'reject'; note?: string }) =>
      usersService.reviewVerification(userId, action, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verification-pending'] })
      qc.invalidateQueries({ queryKey: ['users'] })
    },
  })

  return (
    <>
      <div className="flex justify-end">
        <button onClick={() => refetch()} className="btn-ghost p-2"><RefreshCw className="w-4 h-4" /></button>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-1/3" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : pending.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-3 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-500/50" />
          <p className="text-gray-400 font-medium">Aucune demande en attente</p>
          <p className="text-gray-600 text-sm">Toutes les demandes ont été traitées.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map(user => (
            <VerifCard
              key={user.id}
              user={user}
              expanded={expanded === user.id}
              onToggle={() => setExpanded(expanded === user.id ? null : user.id)}
              rejectNote={rejectNote[user.id] ?? ''}
              onRejectNoteChange={(v) => setRejectNote(prev => ({ ...prev, [user.id]: v }))}
              onApprove={() => mutReview.mutate({ userId: user.id, action: 'approve' })}
              onReject={() => {
                mutReview.mutate({ userId: user.id, action: 'reject', note: rejectNote[user.id] })
                setRejectNote(prev => { const n = { ...prev }; delete n[user.id]; return n })
              }}
              loading={mutReview.isPending && mutReview.variables?.userId === user.id}
            />
          ))}
        </div>
      )}
    </>
  )
}

// ── Onglet Communautés ────────────────────────────────────────────────────────

function CommunitiesVerifTab() {
  const qc = useQueryClient()
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['community-verification-pending'],
    queryFn: () => usersService.listCommunityVerifications('pending'),
    refetchInterval: 30_000,
  })

  const mutApprove = useMutation({
    mutationFn: (id: string) => usersService.approveCommunityVerification(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-verification-pending'] }),
  })

  const mutReject = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => usersService.rejectCommunityVerification(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-verification-pending'] }),
  })

  return (
    <>
      <div className="flex justify-end">
        <button onClick={() => refetch()} className="btn-ghost p-2"><RefreshCw className="w-4 h-4" /></button>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-1/3" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-3 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-500/50" />
          <p className="text-gray-400 font-medium">Aucune demande en attente</p>
          <p className="text-gray-600 text-sm">Toutes les demandes de communautés ont été traitées.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <CommunityVerifCard
              key={req.id}
              req={req}
              expanded={expanded === req.id}
              onToggle={() => setExpanded(expanded === req.id ? null : req.id)}
              rejectNote={rejectNote[req.id] ?? ''}
              onRejectNoteChange={(v) => setRejectNote(prev => ({ ...prev, [req.id]: v }))}
              onApprove={() => mutApprove.mutate(req.id)}
              onReject={() => {
                mutReject.mutate({ id: req.id, note: rejectNote[req.id] })
                setRejectNote(prev => { const n = { ...prev }; delete n[req.id]; return n })
              }}
              loading={(mutApprove.isPending || mutReject.isPending)}
            />
          ))}
        </div>
      )}
    </>
  )
}

interface CommunityVerifCardProps {
  req: CommunityVerifRequest
  expanded: boolean
  onToggle: () => void
  rejectNote: string
  onRejectNoteChange: (v: string) => void
  onApprove: () => void
  onReject: () => void
  loading: boolean
}

function CommunityVerifCard({ req, expanded, onToggle, rejectNote, onRejectNoteChange, onApprove, onReject, loading }: CommunityVerifCardProps) {
  const community = req.community
  const requester = req.requester
  const createdAt = req.created_at
    ? new Date(req.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div className={clsx('card transition-all', expanded && 'ring-1 ring-violet-500/30')}>
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-800/30 transition-colors rounded-xl">
        {/* Avatar communauté */}
        {community?.avatar_url ? (
          <img src={community.avatar_url} className="w-10 h-10 rounded-xl object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-violet-400" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-medium">{community?.name ?? '—'}</span>
            <span className="badge bg-amber-500/15 text-amber-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> En attente
            </span>
            <span className="badge bg-gray-700 text-gray-300">{community?.members_count ?? 0} membres</span>
            {(req.coins_paid ?? 0) > 0 && (
              <span className="badge bg-yellow-500/15 text-yellow-400 flex items-center gap-1">
                <Zap className="w-3 h-3" /> {req.coins_paid} coins
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs mt-0.5">
            par {requester?.display_name ?? requester?.username ?? '—'}
          </p>
        </div>

        <div className="text-right shrink-0 hidden sm:block">
          <p className="text-xs text-gray-500">Demande le</p>
          <p className="text-xs text-gray-300">{createdAt}</p>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-800 pt-4">
          {req.reason ? (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Raison fournie</p>
              <div className="bg-gray-800/60 rounded-lg p-3 text-sm text-gray-200 leading-relaxed">
                {req.reason}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm flex items-center gap-2"><User className="w-4 h-4" /> Aucune raison fournie</p>
          )}

          {(req.coins_paid ?? 0) > 0 && (
            <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 rounded-lg px-3 py-2">
              <Zap className="w-3.5 h-3.5" />
              <span>{req.coins_paid} coins débités — remboursés automatiquement en cas de refus</span>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Note de refus (optionnelle)</p>
            <textarea
              value={rejectNote}
              onChange={e => onRejectNoteChange(e.target.value)}
              placeholder="Ex : Communauté trop récente, activité insuffisante…"
              rows={2}
              className="input w-full resize-none text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onApprove}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <CheckCircle className="w-4 h-4" /> Approuver
            </button>
            <button
              onClick={onReject}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" /> Refuser (et rembourser)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

interface VerifCardProps {
  user: UserType
  expanded: boolean
  onToggle: () => void
  rejectNote: string
  onRejectNoteChange: (v: string) => void
  onApprove: () => void
  onReject: () => void
  loading: boolean
}

function VerifCard({ user, expanded, onToggle, rejectNote, onRejectNoteChange, onApprove, onReject, loading }: VerifCardProps) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || '—'
  const initial = (user.first_name?.[0] ?? user.email[0]).toUpperCase()
  const requestedAt = user.verification_requested_at
    ? new Date(user.verification_requested_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div className={clsx('card transition-all', expanded && 'ring-1 ring-sky-500/30')}>
      {/* Ligne principale */}
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-800/30 transition-colors rounded-xl">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 font-bold text-sm shrink-0">
          {user.avatar_url
            ? <img src={user.avatar_url} className="w-10 h-10 rounded-full object-cover" />
            : initial}
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-medium">{name}</span>
            <span className="badge bg-amber-500/15 text-amber-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> En attente
            </span>
            <span className={clsx('badge', {
              'bg-gray-700 text-gray-300': user.role === 'user',
              'bg-amber-500/20 text-amber-400': user.role === 'artist',
              'bg-violet-500/20 text-violet-400': user.role === 'admin',
            })}>
              {user.role}
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-0.5">{user.email}</p>
        </div>

        {/* Date */}
        <div className="text-right shrink-0 hidden sm:block">
          <p className="text-xs text-gray-500">Demande le</p>
          <p className="text-xs text-gray-300">{requestedAt}</p>
        </div>
      </button>

      {/* Détail expandé */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-800 pt-4">
          {/* Note de l'utilisateur */}
          {user.verification_note ? (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Message de l'utilisateur</p>
              <div className="bg-gray-800/60 rounded-lg p-3 text-sm text-gray-200 leading-relaxed">
                {user.verification_note}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <User className="w-4 h-4" />
              Aucun message fourni
            </div>
          )}

          {/* Note de refus */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Note de refus (optionnelle)</p>
            <textarea
              value={rejectNote}
              onChange={e => onRejectNoteChange(e.target.value)}
              placeholder="Ex : Profil insuffisant, réessayez avec plus d'informations…"
              rows={2}
              className="input w-full resize-none text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onApprove}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              Approuver
            </button>
            <button
              onClick={onReject}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Refuser
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
