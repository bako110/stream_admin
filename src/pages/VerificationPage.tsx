import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersService } from '@/services/users.service'
import { BadgeCheck, CheckCircle, XCircle, Clock, RefreshCw, User } from 'lucide-react'
import type { User as UserType } from '@/types'
import clsx from 'clsx'

export function VerificationPage() {
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

  function approve(userId: string) {
    mutReview.mutate({ userId, action: 'approve' })
  }

  function reject(userId: string) {
    mutReview.mutate({ userId, action: 'reject', note: rejectNote[userId] })
    setRejectNote(prev => { const n = { ...prev }; delete n[userId]; return n })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 flex items-center justify-center">
            <BadgeCheck className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Demandes de vérification FoliX</h2>
            <p className="text-xs text-gray-500">
              {pending.length} demande{pending.length !== 1 ? 's' : ''} en attente
            </p>
          </div>
        </div>
        <button onClick={() => refetch()} className="btn-ghost p-2">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Liste */}
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
              onApprove={() => approve(user.id)}
              onReject={() => reject(user.id)}
              loading={mutReview.isPending && mutReview.variables?.userId === user.id}
            />
          ))}
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
