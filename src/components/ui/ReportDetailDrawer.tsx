import { useAuth } from '@/contexts/AuthContext'
import { X, ShieldBan, Trash2, CheckCircle, Video, Calendar, Music, MessageSquare, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import type { Report, ReportContentType } from '@/types'

const REASON_LABELS: Record<string, string> = {
  spam:           'Spam',
  inappropriate:  'Contenu inapproprié',
  violence:       'Violence',
  harassment:     'Harcèlement',
  misinformation: 'Désinformation',
  other:          'Autre',
}

const CONTENT_TYPE_ICON: Record<ReportContentType, typeof Video> = {
  reel:    Video,
  event:   Calendar,
  concert: Music,
  comment: MessageSquare,
}

const CONTENT_TYPE_LABEL: Record<ReportContentType, string> = {
  reel:    'Reel',
  event:   'Événement',
  concert: 'Concert',
  comment: 'Commentaire',
}

interface Props {
  report: Report
  onClose: () => void
  onBlock: () => void
  onDelete: () => void
  onDismiss: () => void
  isBlocking: boolean
  isDeleting: boolean
  isDismissing: boolean
}

export function ReportDetailDrawer({
  report, onClose, onBlock, onDelete, onDismiss,
  isBlocking, isDeleting, isDismissing,
}: Props) {
  const { user: me } = useAuth()
  const isAdmin = me?.role === 'admin'
  const Icon = CONTENT_TYPE_ICON[report.content_type]
  const preview = report.content_preview
  const isPending = report.status === 'pending'
  const isBlocked = preview?.is_blocked ?? false

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-gray-950 border-l border-gray-800 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-100">
              Signalement — {CONTENT_TYPE_LABEL[report.content_type]}
            </span>
            <span className={clsx('badge text-xs', {
              'bg-amber-500/15 text-amber-400': report.status === 'pending',
              'bg-emerald-500/15 text-emerald-400': report.status === 'resolved',
              'bg-gray-500/15 text-gray-400': report.status === 'dismissed',
            })}>
              {report.status}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Aperçu du contenu */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contenu signalé</h3>
            <div className="rounded-xl overflow-hidden bg-gray-900 border border-gray-800">
              {/* Miniature / vidéo */}
              {report.content_type === 'reel' && preview?.url ? (
                <video
                  src={preview.url}
                  poster={preview.thumbnail_url ?? undefined}
                  controls
                  className="w-full max-h-64 object-contain bg-black"
                />
              ) : preview?.thumbnail_url ? (
                <img
                  src={preview.thumbnail_url}
                  alt=""
                  className="w-full max-h-48 object-cover"
                />
              ) : (
                <div className="h-32 flex items-center justify-center">
                  <Icon className="w-10 h-10 text-gray-700" />
                </div>
              )}

              <div className="p-4 space-y-1">
                <p className="text-gray-100 font-medium text-sm">
                  {preview?.title ?? report.content_id}
                </p>
                {preview?.description && preview.description !== preview.title && (
                  <p className="text-gray-400 text-xs line-clamp-3">{preview.description}</p>
                )}
                {preview?.created_at && (
                  <p className="text-gray-600 text-xs">
                    Publié le {new Date(preview.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
                {isBlocked && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-red-400 font-medium">
                    <ShieldBan className="w-3.5 h-3.5" />
                    Contenu déjà bloqué
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Raison du signalement */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Motif</h3>
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-amber-300 text-sm font-medium">
                {REASON_LABELS[report.reason] ?? report.reason}
              </span>
            </div>
            {report.details && (
              <p className="text-gray-400 text-sm italic bg-gray-900 rounded-lg px-3 py-2 border border-gray-800">
                "{report.details}"
              </p>
            )}
          </section>

          {/* Info signaleur */}
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Signalé par</h3>
            <div className="bg-gray-900 rounded-lg px-3 py-2 border border-gray-800 space-y-0.5">
              <p className="text-gray-200 text-sm">{report.reporter.email}</p>
              {report.reporter.username && (
                <p className="text-gray-500 text-xs">@{report.reporter.username}</p>
              )}
              <p className="text-gray-600 text-xs">
                {new Date(report.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </section>
        </div>

        {/* Actions */}
        {isPending && (
          <div className="border-t border-gray-800 p-4 space-y-2">
            {!isBlocked && (
              <button
                onClick={onBlock}
                disabled={isBlocking}
                className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg py-2.5 transition-colors"
              >
                <ShieldBan className="w-4 h-4" />
                {isBlocking ? 'Blocage…' : 'Bloquer le contenu'}
              </button>
            )}
            {isAdmin && (
              <button
                onClick={onDelete}
                disabled={isDeleting}
                className="w-full flex items-center justify-center gap-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-medium text-sm rounded-lg py-2.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
            )}
            <button
              onClick={onDismiss}
              disabled={isDismissing}
              className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 font-medium text-sm rounded-lg py-2.5 transition-colors"
            >
              <CheckCircle className="w-4 h-4" />
              {isDismissing ? 'En cours…' : 'Ignorer le signalement'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
