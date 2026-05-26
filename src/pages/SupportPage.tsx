import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supportService } from '@/services/support.service'
import type { SupportTicket, SupportMessage } from '@/services/support.service'
import {
  LifeBuoy, RefreshCw, Send, CheckCircle, XCircle,
  Clock, MessageSquare, Eye, ChevronRight, User,
} from 'lucide-react'
import clsx from 'clsx'

const STATUS_LABELS: Record<string, string> = {
  open:     'Ouvert',
  pending:  'En attente',
  resolved: 'Résolu',
  closed:   'Fermé',
}

const STATUS_COLORS: Record<string, string> = {
  open:     'bg-emerald-500/15 text-emerald-400',
  pending:  'bg-amber-500/15 text-amber-400',
  resolved: 'bg-blue-500/15 text-blue-400',
  closed:   'bg-gray-700 text-gray-400',
}

const TABS = [
  { value: '',         label: 'Tous' },
  { value: 'open',     label: 'Ouverts' },
  { value: 'pending',  label: 'En attente' },
  { value: 'resolved', label: 'Résolus' },
  { value: 'closed',   label: 'Fermés' },
]

export function SupportPage() {
  const qc = useQueryClient()
  const [tab,    setTab]    = useState('')
  const [active, setActive] = useState<string | null>(null)

  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ['support-tickets', tab],
    queryFn:  () => supportService.listTickets(tab || undefined),
    refetchInterval: 20_000,
  })

  const openCount = tickets.filter(t => t.status === 'open' && t.unread_count > 0).length

  const activeTicket = tickets.find(t => t.id === active) ?? null

  const handleSelect = (id: string) => {
    setActive(id)
    // refresh pour marquer vu
    qc.invalidateQueries({ queryKey: ['support-ticket-detail', id] })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <LifeBuoy className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              Support utilisateurs
              {openCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-bold">
                  {openCount}
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500">Tickets ouverts par les utilisateurs</p>
          </div>
        </div>
        <button onClick={() => refetch()} className="btn-ghost p-2">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-800/60 rounded-xl w-fit flex-wrap">
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => { setTab(t.value); setActive(null) }}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              tab === t.value ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Layout split */}
      <div className="flex gap-4 h-[calc(100vh-220px)]">
        {/* Liste tickets */}
        <div className="w-80 shrink-0 flex flex-col gap-2 overflow-y-auto pr-1">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-800 rounded w-3/4" />
                    <div className="h-2 bg-gray-800 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          ) : tickets.length === 0 ? (
            <div className="card p-8 flex flex-col items-center gap-2 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500/50" />
              <p className="text-gray-400 text-sm">Aucun ticket</p>
            </div>
          ) : (
            tickets.map(t => (
              <TicketRow
                key={t.id}
                ticket={t}
                isActive={active === t.id}
                onSelect={() => handleSelect(t.id)}
              />
            ))
          )}
        </div>

        {/* Fil de conversation */}
        <div className="flex-1 min-w-0">
          {active && activeTicket ? (
            <ConversationPanel
              ticket={activeTicket}
              onRefresh={() => qc.invalidateQueries({ queryKey: ['support-tickets', tab] })}
            />
          ) : (
            <div className="card h-full flex flex-col items-center justify-center gap-3 text-center">
              <MessageSquare className="w-10 h-10 text-gray-700" />
              <p className="text-gray-500 text-sm">Sélectionnez un ticket pour voir la conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TicketRow({ ticket, isActive, onSelect }: { ticket: SupportTicket; isActive: boolean; onSelect: () => void }) {
  const user = ticket.user
  const name = user?.display_name ?? user?.username ?? user?.email ?? '—'
  const initial = (user?.display_name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()
  const lastMsg = ticket.messages[ticket.messages.length - 1]
  const updatedAt = ticket.updated_at
    ? new Date(ticket.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <button
      onClick={onSelect}
      className={clsx(
        'card w-full text-left p-3.5 transition-all hover:ring-1 hover:ring-violet-500/30',
        isActive && 'ring-1 ring-violet-500/50 bg-violet-500/5',
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 font-bold text-xs shrink-0">
          {user?.avatar_url
            ? <img src={user.avatar_url} className="w-9 h-9 rounded-full object-cover" alt={name} />
            : initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-white truncate">{name}</span>
            {ticket.unread_count > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-400 truncate mt-0.5">{ticket.subject}</p>
          {lastMsg && (
            <p className="text-xs text-gray-600 truncate mt-0.5">
              {lastMsg.is_staff ? 'Vous : ' : ''}{lastMsg.body}
            </p>
          )}
          <div className="flex items-center justify-between mt-1.5">
            <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_COLORS[ticket.status])}>
              {STATUS_LABELS[ticket.status]}
            </span>
            <span className="text-xs text-gray-600">{updatedAt}</span>
          </div>
        </div>
      </div>
    </button>
  )
}

function ConversationPanel({ ticket, onRefresh }: { ticket: SupportTicket; onRefresh: () => void }) {
  const qc = useQueryClient()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [replyText, setReplyText] = useState('')

  // Fetch ticket detail (marks viewed)
  const { data: detail } = useQuery({
    queryKey: ['support-ticket-detail', ticket.id],
    queryFn:  () => supportService.getTicket(ticket.id),
    refetchInterval: 15_000,
  })

  const messages = detail?.messages ?? ticket.messages

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const mutReply = useMutation({
    mutationFn: (body: string) => supportService.reply(ticket.id, body),
    onSuccess: () => {
      setReplyText('')
      qc.invalidateQueries({ queryKey: ['support-ticket-detail', ticket.id] })
      onRefresh()
    },
  })

  const mutStatus = useMutation({
    mutationFn: (status: string) => supportService.setStatus(ticket.id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['support-ticket-detail', ticket.id] })
      onRefresh()
    },
  })

  const user = ticket.user
  const name = user?.display_name ?? user?.username ?? user?.email ?? '—'
  const viewedBy = detail?.viewed_by_name ?? ticket.viewed_by_name

  return (
    <div className="card h-full flex flex-col">
      {/* Header conversation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 font-bold text-xs shrink-0">
            {user?.avatar_url
              ? <img src={user.avatar_url} className="w-8 h-8 rounded-full object-cover" alt={name} />
              : (user?.display_name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{name}</p>
            <p className="text-xs text-gray-500 truncate">{ticket.subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Vu par */}
          {viewedBy && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Eye className="w-3 h-3" /> {viewedBy}
            </span>
          )}
          {/* Status actions */}
          <span className={clsx('text-xs px-2 py-1 rounded-full font-medium', STATUS_COLORS[ticket.status])}>
            {STATUS_LABELS[ticket.status]}
          </span>
          {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
            <button
              onClick={() => mutStatus.mutate('resolved')}
              disabled={mutStatus.isPending}
              className="flex items-center gap-1 text-xs px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" /> Résoudre
            </button>
          )}
          {ticket.status !== 'closed' && (
            <button
              onClick={() => mutStatus.mutate('closed')}
              disabled={mutStatus.isPending}
              className="flex items-center gap-1 text-xs px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" /> Fermer
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} userName={name} userAvatar={user?.avatar_url ?? null} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Zone réponse */}
      {ticket.status !== 'closed' && (
        <div className="px-4 py-3 border-t border-gray-800 shrink-0">
          <div className="flex items-end gap-3">
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && replyText.trim()) {
                  mutReply.mutate(replyText.trim())
                }
              }}
              placeholder="Répondre au ticket… (Ctrl+Enter pour envoyer)"
              rows={3}
              className="input flex-1 resize-none text-sm"
            />
            <button
              onClick={() => { if (replyText.trim()) mutReply.mutate(replyText.trim()) }}
              disabled={!replyText.trim() || mutReply.isPending}
              className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
              Envoyer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MessageBubble({ msg, userName, userAvatar }: {
  msg: SupportMessage
  userName: string
  userAvatar: string | null
}) {
  const isStaff = msg.is_staff
  const time = msg.created_at
    ? new Date(msg.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : ''

  const senderName = isStaff ? (msg.sender_name ?? 'Support') : userName
  const initial = senderName[0]?.toUpperCase() ?? '?'

  return (
    <div className={clsx('flex items-end gap-2.5', isStaff ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div className={clsx(
        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
        isStaff ? 'bg-violet-600/30 text-violet-400' : 'bg-gray-700 text-gray-300',
      )}>
        {!isStaff && userAvatar
          ? <img src={userAvatar} className="w-7 h-7 rounded-full object-cover" alt={userName} />
          : initial}
      </div>

      <div className={clsx('max-w-[70%] space-y-1', isStaff ? 'items-end' : 'items-start')}>
        {/* Nom expéditeur */}
        <p className={clsx('text-xs font-medium', isStaff ? 'text-right text-violet-400' : 'text-left text-gray-400')}>
          {senderName}
          {isStaff && <span className="ml-1 text-gray-600">(Support)</span>}
        </p>
        {/* Bulle */}
        <div className={clsx(
          'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isStaff
            ? 'bg-violet-600 text-white rounded-br-sm'
            : 'bg-gray-800 text-gray-200 rounded-bl-sm',
        )}>
          {msg.body}
        </div>
        <p className={clsx('text-xs text-gray-600', isStaff ? 'text-right' : 'text-left')}>{time}</p>
      </div>
    </div>
  )
}
