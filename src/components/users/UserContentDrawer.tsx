import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usersService } from '@/services/users.service'
import type { User } from '@/types'
import { X, Search, Film, Music, Video, Eye, Calendar } from 'lucide-react'
import clsx from 'clsx'

type TabType = 'all' | 'reels' | 'events' | 'concerts'

const TABS: { key: TabType; label: string; icon: typeof Film }[] = [
  { key: 'all',      label: 'Tout',     icon: Film    },
  { key: 'reels',    label: 'Reels',    icon: Video   },
  { key: 'events',   label: 'Événements', icon: Calendar },
  { key: 'concerts', label: 'Concerts', icon: Music   },
]

interface Props {
  user: User
  onClose: () => void
}

export function UserContentDrawer({ user, onClose }: Props) {
  const [search, setSearch]   = useState('')
  const [tab, setTab]         = useState<TabType>('all')
  const [debouncedQ, setDebouncedQ] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading } = useQuery({
    queryKey: ['user-content', user.id, debouncedQ, tab],
    queryFn: () => usersService.getUserContent(user.id, debouncedQ || undefined, tab === 'all' ? undefined : tab),
  })

  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || user.email
  const totalItems = (data?.reels.length ?? 0) + (data?.events.length ?? 0) + (data?.concerts.length ?? 0)

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-2xl bg-gray-900 flex flex-col shadow-2xl border-l border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-800 shrink-0">
          <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 font-bold uppercase text-sm shrink-0">
            {(user.first_name?.[0] ?? user.email[0]).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-100 font-semibold truncate">{name}</p>
            <p className="text-gray-500 text-xs truncate">{user.email}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search + tabs */}
        <div className="px-5 pt-4 pb-2 space-y-3 shrink-0 border-b border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              className="input pl-9 w-full"
              placeholder="Rechercher dans le contenu…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  tab === t.key
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                )}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : totalItems === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-3">
              <Film className="w-10 h-10 opacity-30" />
              <p className="text-sm">Aucun contenu trouvé</p>
            </div>
          ) : (
            <>
              {/* Reels */}
              {(data?.reels.length ?? 0) > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Video className="w-3.5 h-3.5" /> Reels ({data!.reels.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {data!.reels.map(r => (
                      <div key={r.id} className="relative aspect-[9/16] bg-gray-800 rounded-lg overflow-hidden group">
                        {r.thumbnail_url ? (
                          <img src={r.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                          <p className="text-white text-xs line-clamp-2">{r.caption ?? '—'}</p>
                          <p className="text-gray-300 text-xs flex items-center gap-1 mt-1">
                            <Eye className="w-3 h-3" /> {r.views_count}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Events */}
              {(data?.events.length ?? 0) > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Événements ({data!.events.length})
                  </h3>
                  <div className="space-y-2">
                    {data!.events.map(e => (
                      <div key={e.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                        {e.banner_url ? (
                          <img src={e.banner_url} alt="" className="w-12 h-12 rounded object-cover shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-700 flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-100 text-sm font-medium truncate">{e.title}</p>
                          <p className="text-gray-500 text-xs">{e.starts_at ? new Date(e.starts_at).toLocaleDateString('fr-FR') : '—'}</p>
                        </div>
                        <StatusBadge status={e.status} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Concerts */}
              {(data?.concerts.length ?? 0) > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Music className="w-3.5 h-3.5" /> Concerts ({data!.concerts.length})
                  </h3>
                  <div className="space-y-2">
                    {data!.concerts.map(c => (
                      <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                        {c.banner_url ? (
                          <img src={c.banner_url} alt="" className="w-12 h-12 rounded object-cover shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-700 flex items-center justify-center shrink-0">
                            <Music className="w-5 h-5 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-100 text-sm font-medium truncate">{c.title}</p>
                          <p className="text-gray-500 text-xs">{c.starts_at ? new Date(c.starts_at).toLocaleDateString('fr-FR') : '—'}</p>
                        </div>
                        <StatusBadge status={c.status} />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: 'bg-emerald-500/15 text-emerald-400',
    draft:     'bg-gray-500/15 text-gray-400',
    cancelled: 'bg-red-500/15 text-red-400',
    ended:     'bg-gray-500/15 text-gray-400',
  }
  return (
    <span className={clsx('badge text-xs shrink-0', map[status] ?? 'bg-gray-500/15 text-gray-400')}>
      {status}
    </span>
  )
}
