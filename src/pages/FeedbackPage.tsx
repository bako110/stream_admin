import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { feedbackService } from '@/services/feedback.service'
import type { Feedback, FeedbackCategory } from '@/types'
import { RefreshCw, Bug, Lightbulb, MessageSquare, Send } from 'lucide-react'
import clsx from 'clsx'

const STATUS_TABS = [
  { key: 'nouveau', label: 'Nouveaux' },
  { key: 'lu',       label: 'Lus' },
  { key: 'traite',   label: 'Traités' },
  { key: 'all',      label: 'Tous' },
]

const CATEGORY_META: Record<FeedbackCategory, { label: string; icon: typeof Bug; color: string }> = {
  bug:        { label: 'Bug',         icon: Bug,           color: 'text-red-400' },
  suggestion: { label: 'Suggestion',  icon: Lightbulb,     color: 'text-amber-400' },
  avis:       { label: 'Avis',        icon: MessageSquare, color: 'text-violet-400' },
}

export function FeedbackPage() {
  const qc = useQueryClient()
  const [statusTab, setStatusTab] = useState('nouveau')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [responseDraft, setResponseDraft] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['feedback', statusTab],
    queryFn: () => feedbackService.list(statusTab),
  })

  const mutRead = useMutation({
    mutationFn: (id: string) => feedbackService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feedback'] }),
  })

  const mutRespond = useMutation({
    mutationFn: ({ id, response }: { id: string; response: string }) => feedbackService.respond(id, response),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback'] })
      setExpanded(null)
      setResponseDraft('')
    },
  })

  function toggleExpand(f: Feedback) {
    if (expanded === f.id) {
      setExpanded(null)
      return
    }
    setExpanded(f.id)
    setResponseDraft(f.admin_response ?? '')
    if (f.status === 'nouveau') mutRead.mutate(f.id)
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

      {/* Liste */}
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
            Aucun retour {statusTab === 'nouveau' ? 'nouveau' : ''}
          </div>
        ) : (
          items.map(f => {
            const meta = CATEGORY_META[f.category]
            const Icon = meta.icon
            const isOpen = expanded === f.id
            return (
              <div key={f.id}>
                <div
                  className="flex items-start gap-4 p-4 hover:bg-gray-800/30 transition-colors cursor-pointer"
                  onClick={() => toggleExpand(f)}
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-800 shrink-0 flex items-center justify-center">
                    <Icon className={clsx('w-5 h-5', meta.color)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={clsx('text-xs font-medium uppercase tracking-wide', meta.color)}>
                        {meta.label}
                      </span>
                      <span className={clsx('badge text-xs', {
                        'bg-blue-500/15 text-blue-400':    f.status === 'nouveau',
                        'bg-gray-500/15 text-gray-400':     f.status === 'lu',
                        'bg-emerald-500/15 text-emerald-400': f.status === 'traite',
                      })}>
                        {f.status}
                      </span>
                    </div>

                    <p className="text-gray-100 text-sm truncate">{f.message}</p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                      <span>{f.user.display_name ?? f.user.username ?? f.user.email}</span>
                      <span>{new Date(f.created_at).toLocaleDateString('fr-FR')}</span>
                      {f.admin_response && <span className="text-emerald-400">Répondu</span>}
                    </div>
                  </div>
                </div>

                {/* Détail + réponse — déplié */}
                {isOpen && (
                  <div className="px-4 pb-4 pl-[4.5rem] space-y-3" onClick={e => e.stopPropagation()}>
                    <p className="text-sm text-gray-300 whitespace-pre-wrap bg-gray-900 rounded-lg p-3 border border-gray-800">
                      {f.message}
                    </p>

                    {f.admin_response && (
                      <div className="text-sm text-gray-300 bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
                        <p className="text-xs font-medium text-violet-400 mb-1">Réponse envoyée</p>
                        {f.admin_response}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={responseDraft}
                        onChange={e => setResponseDraft(e.target.value)}
                        placeholder="Répondre à cet utilisateur…"
                        className="input flex-1 text-sm"
                        maxLength={2000}
                      />
                      <button
                        onClick={() => responseDraft.trim() && mutRespond.mutate({ id: f.id, response: responseDraft.trim() })}
                        disabled={!responseDraft.trim() || mutRespond.isPending}
                        className="btn-primary px-3 py-2 flex items-center gap-1.5 text-sm disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" /> Envoyer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {data && (
        <p className="text-xs text-gray-500">{data.total} retour{data.total !== 1 ? 's' : ''}</p>
      )}
    </div>
  )
}
