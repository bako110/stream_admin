import React, { useState, useEffect, useRef } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { notificationsService } from '@/services/notifications.service'
import type { AdminUserResult, AppUpdatePlatform } from '@/services/notifications.service'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Bell, Send, Users, User, Search, CheckCircle, X, Smartphone, Apple } from 'lucide-react'
import clsx from 'clsx'

type Mode = 'broadcast' | 'targeted' | 'app_update'

export function NotificationsPage() {
  const [mode, setMode] = useState<Mode>('broadcast')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [platform, setPlatform] = useState<AppUpdatePlatform>('all')
  const [selectedUser, setSelectedUser] = useState<AdminUserResult | null>(null)
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [result, setResult] = useState<{ kind: Mode; sent: number | boolean; platform?: AppUpdatePlatform } | null>(null)
  const searchBoxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const { data: results = [], isFetching: searching } = useQuery({
    queryKey: ['admin-notif-user-search', query],
    queryFn: () => notificationsService.searchUsers(query),
    enabled: query.trim().length >= 2,
  })

  const resetForm = () => {
    setBody('')
    setTitle('')
    setImageUrl('')
  }

  const mutBroadcast = useMutation({
    mutationFn: () => imageUrl.trim()
      ? notificationsService.broadcastWithImage({ title: title.trim() || undefined, body: body.trim(), image_url: imageUrl.trim() })
      : notificationsService.broadcast({ title: title.trim() || undefined, body: body.trim() }),
    onSuccess: (data) => {
      setResult({ kind: 'broadcast', sent: data.sent })
      resetForm()
    },
  })

  const mutSendToUser = useMutation({
    mutationFn: () => {
      if (!selectedUser) throw new Error('no target')
      return notificationsService.sendToUser(selectedUser.id, { title: title.trim() || undefined, body: body.trim() })
    },
    onSuccess: (data) => {
      setResult({ kind: 'targeted', sent: data.sent })
      resetForm()
      setSelectedUser(null)
      setQuery('')
    },
  })

  const mutAppUpdate = useMutation({
    mutationFn: () => notificationsService.sendAppUpdate({
      title: title.trim() || undefined,
      body: body.trim(),
      platform,
      image_url: imageUrl.trim() || undefined,
    }),
    onSuccess: (data) => {
      setResult({ kind: 'app_update', sent: data.sent, platform: data.platform })
      resetForm()
    },
  })

  const isPending = mutBroadcast.isPending || mutSendToUser.isPending || mutAppUpdate.isPending
  const canSend = body.trim().length > 0 && (mode === 'broadcast' || mode === 'app_update' || !!selectedUser)

  const platformLabel: Record<AppUpdatePlatform, string> = { android: 'Android', ios: 'iOS', all: 'Toutes plateformes' }

  const handleSend = () => {
    setResult(null)
    if (mode === 'broadcast') {
      if (!confirm('Envoyer cette annonce à TOUS les utilisateurs actifs ? Cette action est irréversible.')) return
      mutBroadcast.mutate()
    } else if (mode === 'app_update') {
      if (!confirm(`Envoyer cette notification de mise à jour aux utilisateurs ${platformLabel[platform]} ? Cette action est irréversible.`)) return
      mutAppUpdate.mutate()
    } else {
      mutSendToUser.mutate()
    }
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
          <Bell className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-white">Notifications</h2>
          <p className="text-xs text-gray-500">Annonces, mises à jour et messages ciblés</p>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-gray-800/60 rounded-xl w-fit flex-wrap">
        <button
          onClick={() => { setMode('broadcast'); setResult(null) }}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            mode === 'broadcast' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200',
          )}
        >
          <Users className="w-3.5 h-3.5" /> Diffusion générale
        </button>
        <button
          onClick={() => { setMode('targeted'); setResult(null) }}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            mode === 'targeted' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200',
          )}
        >
          <User className="w-3.5 h-3.5" /> Utilisateur ciblé
        </button>
        <button
          onClick={() => { setMode('app_update'); setResult(null) }}
          className={clsx(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            mode === 'app_update' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-gray-200',
          )}
        >
          <Smartphone className="w-3.5 h-3.5" /> Mise à jour app
        </button>
      </div>

      <div className="card p-5 space-y-4">
        {mode === 'targeted' && (
          <div className="space-y-2" ref={searchBoxRef}>
            <label className="text-xs font-medium text-gray-400">Destinataire</label>
            {selectedUser ? (
              <div className="flex items-center justify-between px-3 py-2 bg-gray-800/60 rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 font-bold text-xs shrink-0">
                    {selectedUser.avatar_url
                      ? <img src={selectedUser.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />
                      : (selectedUser.display_name?.[0] ?? selectedUser.email[0]).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{selectedUser.display_name ?? selectedUser.username ?? selectedUser.email}</p>
                    <p className="text-xs text-gray-500 truncate">{selectedUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-gray-500 hover:text-gray-300 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  value={query}
                  onChange={e => { setQuery(e.target.value); setShowResults(true) }}
                  onFocus={() => setShowResults(true)}
                  placeholder="Rechercher par nom, username ou email…"
                  className="input pl-9 text-sm w-full"
                />
                {showResults && query.trim().length >= 2 && (
                  <div className="absolute z-10 mt-1 w-full max-h-64 overflow-y-auto bg-gray-900 border border-gray-800 rounded-lg shadow-xl">
                    {searching ? (
                      <div className="p-3 text-xs text-gray-500 text-center">Recherche…</div>
                    ) : results.length === 0 ? (
                      <div className="p-3 text-xs text-gray-500 text-center">Aucun utilisateur trouvé</div>
                    ) : (
                      results.map(u => (
                        <button
                          key={u.id}
                          onClick={() => { setSelectedUser(u); setShowResults(false) }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-800 transition-colors text-left"
                        >
                          <div className="w-7 h-7 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 font-bold text-xs shrink-0">
                            {u.avatar_url
                              ? <img src={u.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />
                              : (u.display_name?.[0] ?? u.email[0]).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-white truncate">{u.display_name ?? u.username ?? u.email}</p>
                            <p className="text-xs text-gray-500 truncate">{u.email}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {mode === 'app_update' && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400">Plateforme ciblée</label>
            <div className="flex flex-wrap gap-2">
              {(['android', 'ios', 'all'] as AppUpdatePlatform[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
                    platform === p
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:text-gray-200',
                  )}
                >
                  {p === 'android' ? <Smartphone className="w-3.5 h-3.5" /> : p === 'ios' ? <Apple className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                  {platformLabel[p]}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              {platform === 'all'
                ? 'Envoyée à tous les utilisateurs actifs, quelle que soit leur plateforme.'
                : `Envoyée uniquement aux utilisateurs ayant déjà utilisé l'app sur ${platformLabel[platform]} — jamais aux utilisateurs ${platform === 'android' ? 'iOS' : 'Android'}.`}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400">Titre (optionnel)</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={mode === 'app_update' ? 'Mise à jour disponible' : 'Annonce'}
            maxLength={200}
            className="input text-sm w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400">Message</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={mode === 'app_update' ? 'Une nouvelle version de GoFolyX est disponible avec…' : 'Contenu de la notification…'}
            rows={4}
            maxLength={2000}
            className="input resize-none text-sm w-full"
          />
          <p className="text-xs text-gray-600 text-right">{body.length}/2000</p>
        </div>

        {(mode === 'broadcast' || mode === 'app_update') && (
          <ImageUpload
            value={imageUrl}
            onChange={setImageUrl}
            label="Image jointe (optionnel)"
            aspect="banner"
          />
        )}

        {mode === 'broadcast' && (
          <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <Users className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/90">
              Cette annonce sera envoyée à <strong>tous les utilisateurs actifs</strong> de l'application.
            </p>
          </div>
        )}

        {mode === 'app_update' && (
          <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <Smartphone className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/90">
              Le mobile ouvre automatiquement le Play Store ou l'App Store selon l'appareil de chaque utilisateur — pas besoin de fournir de lien.
            </p>
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={!canSend || isPending}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Send className="w-4 h-4" />
          {isPending ? 'Envoi…' : mode === 'broadcast' ? 'Diffuser à tous' : mode === 'app_update' ? 'Envoyer la notification' : 'Envoyer'}
        </button>

        {result && (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-300/90">
              {result.kind === 'broadcast'
                ? `Notification envoyée à ${result.sent} utilisateur${(result.sent as number) > 1 ? 's' : ''}.`
                : result.kind === 'app_update'
                ? `Notification envoyée à ${result.sent} utilisateur${(result.sent as number) > 1 ? 's' : ''} (${platformLabel[result.platform ?? 'all']}).`
                : 'Notification envoyée avec succès.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
