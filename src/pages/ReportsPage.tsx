import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reportsService } from '@/services/reports.service'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ReportDetailDrawer } from '@/components/ui/ReportDetailDrawer'
import type { Report, ReportContentType } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { Trash2, CheckCircle, RefreshCw, Video, Calendar, Music, MessageSquare, ShieldBan, FileText, Radio } from 'lucide-react'
import clsx from 'clsx'

const STATUS_TABS = [
  { key: 'pending',   label: 'En attente' },
  { key: 'resolved',  label: 'Résolus' },
  { key: 'dismissed', label: 'Ignorés' },
  { key: 'all',       label: 'Tous' },
]

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
  post:    FileText,
  live:    Radio,
}

export function ReportsPage() {
  const qc = useQueryClient()
  const { user: me } = useAuth()
  const isAdmin = me?.role === 'admin'
  const [statusTab, setStatusTab] = useState('pending')
  const [selected, setSelected] = useState<Report | null>(null)
  const [confirm, setConfirm] = useState<{ reportId: string; action: 'delete' | 'dismiss'; label: string } | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reports', statusTab],
    queryFn: () => reportsService.list(statusTab),
  })

  const mutBlock = useMutation({
    mutationFn: (id: string) => reportsService.blockContent(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reports'] }); setSelected(null) },
  })
  const mutDelete = useMutation({
    mutationFn: (id: string) => reportsService.deleteContent(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reports'] }); setSelected(null); setConfirm(null) },
  })
  const mutDismiss = useMutation({
    mutationFn: (id: string) => reportsService.dismiss(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reports'] }); setSelected(null); setConfirm(null) },
  })

  function handleConfirm() {
    if (!confirm) return
    if (confirm.action === 'delete') mutDelete.mutate(confirm.reportId)
    if (confirm.action === 'dismiss') mutDismiss.mutate(confirm.reportId)
  }

  const items = data?.items ?? []

  return (
    <div className="space-y-4">
      {/* Tabs + refresh */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 bg-gray-900 p-1 rounded-lg border border-gray-800">
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setStatusTab(t.key)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                statusTab === t.key ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => refetch()} className="btn-ghost p-2 ml-auto">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* List */}
      <div className="card divide-y divide-gray-800">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-800 rounded w-1/3" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-sm">
            Aucun signalement {statusTab === 'pending' ? 'en attente' : ''}
          </div>
        ) : (
          items.map(report => (
            <ReportRow
              key={report.id}
              report={report}
              isAdmin={isAdmin}
              onClick={() => setSelected(report)}
              onDelete={() => setConfirm({
                reportId: report.id,
                action: 'delete',
                label: `Supprimer définitivement ce contenu (${report.content_type}) ?`,
              })}
              onDismiss={() => setConfirm({
                reportId: report.id,
                action: 'dismiss',
                label: `Ignorer ce signalement ?`,
              })}
            />
          ))
        )}
      </div>

      {data && (
        <p className="text-xs text-gray-500">{data.total} signalement{data.total !== 1 ? 's' : ''}</p>
      )}

      {/* Drawer détail */}
      {selected && (
        <ReportDetailDrawer
          report={selected}
          onClose={() => setSelected(null)}
          onBlock={() => mutBlock.mutate(selected.id)}
          onDelete={() => setConfirm({ reportId: selected.id, action: 'delete', label: `Supprimer définitivement ce contenu (${selected.content_type}) ?` })}
          onDismiss={() => setConfirm({ reportId: selected.id, action: 'dismiss', label: 'Ignorer ce signalement ?' })}
          isBlocking={mutBlock.isPending}
          isDeleting={mutDelete.isPending}
          isDismissing={mutDismiss.isPending}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title="Confirmer l'action"
          message={confirm.label}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
          danger={confirm.action === 'delete'}
        />
      )}
    </div>
  )
}

interface ReportRowProps {
  report: Report
  isAdmin: boolean
  onClick: () => void
  onDelete: () => void
  onDismiss: () => void
}

function ReportRow({ report, isAdmin, onClick, onDelete, onDismiss }: ReportRowProps) {
  const Icon = CONTENT_TYPE_ICON[report.content_type] ?? FileText
  const isBlocked = report.content_preview?.is_blocked ?? false

  return (
    <div
      className="flex items-start gap-4 p-4 hover:bg-gray-800/30 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Thumbnail ou icône */}
      <div className="w-16 h-16 rounded-lg bg-gray-800 overflow-hidden shrink-0 flex items-center justify-center">
        {report.content_preview?.thumbnail_url ? (
          <img src={report.content_preview.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <Icon className="w-6 h-6 text-gray-600" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{report.content_type}</span>
          <span className={clsx('badge text-xs', {
            'bg-amber-500/15 text-amber-400': report.status === 'pending',
            'bg-emerald-500/15 text-emerald-400': report.status === 'resolved',
            'bg-gray-500/15 text-gray-400': report.status === 'dismissed',
          })}>
            {report.status}
          </span>
          {isBlocked && (
            <span className="flex items-center gap-1 text-xs text-red-400 font-medium">
              <ShieldBan className="w-3 h-3" /> Bloqué
            </span>
          )}
        </div>

        <p className="text-gray-100 text-sm font-medium truncate">
          {report.content_preview?.title ?? report.content_id}
        </p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
          <span className="text-amber-400 font-medium">{REASON_LABELS[report.reason] ?? report.reason}</span>
          {report.details && <span className="truncate max-w-xs italic">"{report.details}"</span>}
          <span>par {report.reporter.email}</span>
          <span>{new Date(report.created_at).toLocaleDateString('fr-FR')}</span>
        </div>
      </div>

      {/* Actions rapides — stoppe la propagation pour ne pas ouvrir le drawer */}
      {report.status === 'pending' && (
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={onDismiss}
            title="Ignorer"
            className="p-1.5 text-gray-400 hover:text-emerald-400 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button
              onClick={onDelete}
              title="Supprimer le contenu"
              className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
