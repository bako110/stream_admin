import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { monetizationService } from '@/services/monetization.service'
import type { MonetizationRequest } from '@/services/monetization.service'
import { DollarSign, CheckCircle, XCircle, Clock, RefreshCw, User } from 'lucide-react'
import clsx from 'clsx'

const CREATOR_TYPE_LABELS: Record<string, string> = {
  musician: 'Musicien',
  creator:  'Créateur',
  dj:       'DJ / Beatmaker',
  comedian: 'Humoriste',
  brand:    'Marque',
  other:    'Autre',
}

export function MonetizationPage() {
  const qc = useQueryClient()
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({})
  const [expanded,   setExpanded]   = useState<string | null>(null)

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['monetization-pending'],
    queryFn:  () => monetizationService.listRequests('pending'),
    refetchInterval: 30_000,
  })

  const mutApprove = useMutation({
    mutationFn: (id: string) => monetizationService.approveRequest(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['monetization-pending'] }),
  })

  const mutReject = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      monetizationService.rejectRequest(id, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['monetization-pending'] }),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">Demandes de monétisation</h2>
          <p className="text-xs text-gray-500">Programme Créateur FoliX</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
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
      ) : requests.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-3 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-500/50" />
          <p className="text-gray-400 font-medium">Aucune demande en attente</p>
          <p className="text-gray-600 text-sm">Toutes les demandes ont été traitées.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <MonetizationCard
              key={req.id}
              req={req}
              expanded={expanded === req.id}
              onToggle={() => setExpanded(expanded === req.id ? null : req.id)}
              rejectNote={rejectNote[req.id] ?? ''}
              onRejectNoteChange={v => setRejectNote(prev => ({ ...prev, [req.id]: v }))}
              onApprove={() => mutApprove.mutate(req.id)}
              onReject={() => {
                mutReject.mutate({ id: req.id, note: rejectNote[req.id] })
                setRejectNote(prev => { const n = { ...prev }; delete n[req.id]; return n })
              }}
              loading={
                (mutApprove.isPending && (mutApprove.variables as string) === req.id) ||
                (mutReject.isPending  && (mutReject.variables as { id: string })?.id === req.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface MonetizationCardProps {
  req: MonetizationRequest
  expanded: boolean
  onToggle: () => void
  rejectNote: string
  onRejectNoteChange: (v: string) => void
  onApprove: () => void
  onReject: () => void
  loading: boolean
}

function MonetizationCard({
  req, expanded, onToggle, rejectNote, onRejectNoteChange, onApprove, onReject, loading,
}: MonetizationCardProps) {
  const user       = req.user
  const name       = user?.display_name ?? user?.username ?? '—'
  const initial    = (user?.display_name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()
  const typeLabel  = CREATOR_TYPE_LABELS[req.creator_type] ?? req.creator_type
  const createdAt  = req.created_at
    ? new Date(req.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div className={clsx('card transition-all', expanded && 'ring-1 ring-emerald-500/30')}>
      {/* Ligne principale */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-800/30 transition-colors rounded-xl"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-emerald-600/20 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
          {user?.avatar_url
            ? <img src={user.avatar_url} className="w-10 h-10 rounded-full object-cover" alt={name} />
            : initial}
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-medium">{name}</span>
            <span className="badge bg-amber-500/15 text-amber-400 flex items-center gap-1">
              <Clock className="w-3 h-3" /> En attente
            </span>
            <span className="badge bg-emerald-500/15 text-emerald-400">
              {typeLabel}
            </span>
            {req.monthly_audience && (
              <span className="badge bg-gray-700 text-gray-300">{req.monthly_audience}</span>
            )}
          </div>
          <p className="text-gray-500 text-xs mt-0.5">{user?.email ?? '—'}</p>
        </div>

        {/* Date */}
        <div className="text-right shrink-0 hidden sm:block">
          <p className="text-xs text-gray-500">Demande le</p>
          <p className="text-xs text-gray-300">{createdAt}</p>
        </div>
      </button>

      {/* Détail expandé */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-800 pt-4">
          {/* Nom public + description */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Nom public</p>
            <p className="text-sm text-gray-200 font-medium">{req.display_name}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Description</p>
            <div className="bg-gray-800/60 rounded-lg p-3 text-sm text-gray-200 leading-relaxed">
              {req.description}
            </div>
          </div>

          {req.social_links && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Liens / Portfolio</p>
              <p className="text-sm text-emerald-400 break-all">{req.social_links}</p>
            </div>
          )}

          {req.has_existing_revenue && (
            <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 rounded-lg px-3 py-2">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Génère déjà des revenus avec son contenu</span>
            </div>
          )}

          {/* Note de refus */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Note de refus (optionnelle)</p>
            <textarea
              value={rejectNote}
              onChange={e => onRejectNoteChange(e.target.value)}
              placeholder="Ex : Audience insuffisante, contenu non conforme…"
              rows={2}
              className="input w-full resize-none text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onApprove}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
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
