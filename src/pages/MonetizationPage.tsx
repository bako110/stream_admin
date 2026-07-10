import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { monetizationService } from '@/services/monetization.service'
import type { MonetizationRequest, UserDetail } from '@/services/monetization.service'
import {
  DollarSign, CheckCircle, XCircle, Clock, RefreshCw,
  Users, Film, FileText, AlertTriangle, ShieldOff, Shield, Calendar,
} from 'lucide-react'
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
    mutationFn: ({ id, note }: { id: string; note: string }) =>
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
  const user      = req.user
  const name      = user?.display_name ?? user?.username ?? '—'
  const initial   = (user?.display_name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()
  const typeLabel = CREATOR_TYPE_LABELS[req.creator_type] ?? req.creator_type
  const createdAt = req.created_at
    ? new Date(req.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  const { data: detail, isLoading: detailLoading } = useQuery<UserDetail>({
    queryKey: ['monetization-user-detail', req.id],
    queryFn:  () => monetizationService.getUserDetail(req.id),
    enabled:  expanded,
    staleTime: 60_000,
  })

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
            {req.auto_review_at && <AutoReviewBadge autoReviewAt={req.auto_review_at} />}
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

          {/* Profil utilisateur */}
          {detailLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-800 rounded-lg" />
              ))}
            </div>
          ) : detail ? (
            <UserDetailPanel detail={detail} />
          ) : null}

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
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Motif de refus (obligatoire pour refuser)</p>
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
              disabled={loading || rejectNote.trim().length < 3}
              title={rejectNote.trim().length < 3 ? 'Indiquez un motif de refus' : undefined}
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

function UserDetailPanel({ detail }: { detail: UserDetail }) {
  const reportRisk =
    detail.total_reports_received >= 10 ? 'high'
    : detail.total_reports_received >= 3  ? 'medium'
    : 'low'

  const accountAge = detail.account_age_days != null
    ? detail.account_age_days >= 365
      ? `${Math.floor(detail.account_age_days / 365)} an${Math.floor(detail.account_age_days / 365) > 1 ? 's' : ''}`
      : `${detail.account_age_days} j`
    : '—'

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 uppercase tracking-wide">Profil utilisateur</p>

      {/* Status badges */}
      <div className="flex items-center gap-2 flex-wrap">
        {!detail.is_active && (
          <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/15 text-red-400">
            <ShieldOff className="w-3 h-3" /> Compte bloqué
          </span>
        )}
        {detail.is_verified && (
          <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400">
            <Shield className="w-3 h-3" /> Vérifié FoliX
          </span>
        )}
        {detail.verification_status === 'pending' && (
          <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400">
            <Clock className="w-3 h-3" /> Vérification en cours
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <StatTile icon={<Users className="w-4 h-4" />} label="Abonnés"  value={fmt(detail.followers_count)} color="text-emerald-400" />
        <StatTile icon={<Users className="w-4 h-4" />} label="Abonnements" value={fmt(detail.following_count)} color="text-gray-400" />
        <StatTile icon={<Film className="w-4 h-4" />} label="Reels"  value={fmt(detail.reels_count)}   color="text-purple-400" />
        <StatTile icon={<FileText className="w-4 h-4" />} label="Posts" value={fmt(detail.posts_count)}  color="text-blue-400" />
        <StatTile
          icon={<AlertTriangle className="w-4 h-4" />}
          label="Signalements"
          value={String(detail.total_reports_received)}
          sub={detail.pending_reports > 0 ? `${detail.pending_reports} en attente` : undefined}
          color={reportRisk === 'high' ? 'text-red-400' : reportRisk === 'medium' ? 'text-amber-400' : 'text-gray-400'}
          highlight={reportRisk !== 'low'}
        />
        <StatTile icon={<Calendar className="w-4 h-4" />} label="Ancienneté" value={accountAge} color="text-gray-400" />
      </div>

      {/* Report risk banner */}
      {reportRisk === 'high' && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Compte avec un nombre élevé de signalements — vérification recommandée avant approbation.</span>
        </div>
      )}
      {reportRisk === 'medium' && (
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Quelques signalements reçus — à prendre en compte.</span>
        </div>
      )}
    </div>
  )
}

function StatTile({
  icon, label, value, sub, color, highlight,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  color: string
  highlight?: boolean
}) {
  return (
    <div className={clsx(
      'rounded-lg px-3 py-2.5 flex flex-col gap-0.5',
      highlight ? 'bg-red-500/8 border border-red-500/20' : 'bg-gray-800/60',
    )}>
      <div className={clsx('flex items-center gap-1.5', color)}>
        {icon}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={clsx('text-sm font-semibold', color)}>{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  )
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

function AutoReviewBadge({ autoReviewAt }: { autoReviewAt: string }) {
  const remainingMs = new Date(autoReviewAt).getTime() - Date.now()
  if (remainingMs <= 0) {
    return (
      <span className="badge bg-amber-500/15 text-amber-400 flex items-center gap-1">
        <Clock className="w-3 h-3" /> Validation auto imminente
      </span>
    )
  }
  const hours = Math.ceil(remainingMs / (3600 * 1000))
  return (
    <span className="badge bg-violet-500/15 text-violet-400 flex items-center gap-1">
      <Clock className="w-3 h-3" /> Auto-validée dans {hours}h si non traitée
    </span>
  )
}
