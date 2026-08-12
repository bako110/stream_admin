import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { contentService } from '@/services/content.service'
import { useAuth } from '@/contexts/AuthContext'
import {
  Users, Film, Tv, Music2, CalendarDays, Play,
  CreditCard, BadgeCheck, Layers, ArrowRight,
} from 'lucide-react'
import clsx from 'clsx'

export function DashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isManager = user?.role === 'manager'

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: contentService.getDashboard,
    refetchInterval: 60_000,
  })

  if (error) {
    return (
      <div className="card p-8 text-center text-red-400">
        Impossible de charger les statistiques. Vérifiez la connexion au backend.
      </div>
    )
  }

  const loading = isLoading

  return (
    <div className="space-y-6">

      {/* Ligne 1 — chiffres clés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {!isManager && (
          <KpiCard
            label="Utilisateurs"
            value={data?.users}
            icon={Users}
            color="text-blue-400"
            bg="bg-blue-500/10"
            loading={loading}
            onClick={() => navigate('/users')}
          />
        )}
        <KpiCard
          label="Abonnés actifs"
          value={data?.subscriptions}
          icon={BadgeCheck}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
          loading={loading}
        />
        <KpiCard
          label="Paiements"
          value={data?.payments}
          icon={CreditCard}
          color="text-amber-400"
          bg="bg-amber-500/10"
          loading={loading}
        />
        <KpiCard
          label="Reels"
          value={data?.reels}
          icon={Play}
          color="text-cyan-400"
          bg="bg-cyan-500/10"
          loading={loading}
        />
      </div>

      {/* Ligne 2 — contenu */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contenu</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <ContentCard
            label="Films"
            value={data?.films}
            total={data?.contents}
            icon={Film}
            color="text-violet-400"
            bg="bg-violet-500/10"
            loading={loading}
            onClick={() => navigate('/content/films')}
          />
          <ContentCard
            label="Séries"
            value={data?.series}
            total={data?.contents}
            icon={Tv}
            color="text-pink-400"
            bg="bg-pink-500/10"
            loading={loading}
            onClick={() => navigate('/content/series')}
          />
          <ContentCard
            label="Concerts"
            value={data?.concerts}
            icon={Music2}
            color="text-amber-400"
            bg="bg-amber-500/10"
            loading={loading}
          />
          <ContentCard
            label="Événements"
            value={data?.events}
            icon={CalendarDays}
            color="text-teal-400"
            bg="bg-teal-500/10"
            loading={loading}
          />
        </div>
      </div>

      {/* Ligne 3 — accès rapides */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Accès rapides</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <ShortcutCard
            label="Gérer les films"
            desc="Ajouter, modifier, publier"
            icon={Film}
            color="text-violet-400"
            bg="bg-violet-500/10"
            onClick={() => navigate('/content/films')}
          />
          <ShortcutCard
            label="Gérer les séries"
            desc="Séries, saisons, épisodes"
            icon={Layers}
            color="text-pink-400"
            bg="bg-pink-500/10"
            onClick={() => navigate('/content/series')}
          />
          {!isManager && (
            <ShortcutCard
              label="Utilisateurs"
              desc="Comptes, rôles, accès"
              icon={Users}
              color="text-blue-400"
              bg="bg-blue-500/10"
              onClick={() => navigate('/users')}
            />
          )}
        </div>
      </div>

    </div>
  )
}

// ── Composants internes ────────────────────────────────────────────────────────

function KpiCard({
  label, value, icon: Icon, color, bg, loading, onClick,
}: {
  label: string; value: number | undefined; icon: React.ElementType
  color: string; bg: string; loading: boolean; onClick?: () => void
}) {
  return (
    <div
      className={clsx('card p-5 flex items-center gap-4', onClick && 'cursor-pointer hover:border-gray-600 transition-colors')}
      onClick={onClick}
    >
      <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', bg)}>
        <Icon className={clsx('w-5 h-5', color)} />
      </div>
      <div className="min-w-0">
        <p className="text-gray-400 text-xs truncate">{label}</p>
        {loading ? (
          <div className="h-7 w-16 bg-gray-800 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-2xl font-bold text-white mt-0.5">{value?.toLocaleString('fr-FR') ?? '—'}</p>
        )}
      </div>
    </div>
  )
}

function ContentCard({
  label, value, total, icon: Icon, color, bg, loading, onClick,
}: {
  label: string; value: number | undefined; total?: number; icon: React.ElementType
  color: string; bg: string; loading: boolean; onClick?: () => void
}) {
  const pct = total && value ? Math.round((value / total) * 100) : null

  return (
    <div
      className={clsx('card p-5', onClick && 'cursor-pointer hover:border-gray-600 transition-colors')}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center', bg)}>
          <Icon className={clsx('w-4 h-4', color)} />
        </div>
        {onClick && <ArrowRight className="w-4 h-4 text-gray-600" />}
      </div>
      {loading ? (
        <div className="h-8 w-12 bg-gray-800 rounded animate-pulse" />
      ) : (
        <p className="text-3xl font-bold text-white">{value?.toLocaleString('fr-FR') ?? '—'}</p>
      )}
      <div className="flex items-center justify-between mt-1">
        <p className="text-sm text-gray-400">{label}</p>
        {pct !== null && <p className={clsx('text-xs font-medium', color)}>{pct}%</p>}
      </div>
      {pct !== null && (
        <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div className={clsx('h-full rounded-full', bg.replace('/10', '/60'))} style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}

function ShortcutCard({
  label, desc, icon: Icon, color, bg, onClick,
}: {
  label: string; desc: string; icon: React.ElementType
  color: string; bg: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="card p-4 flex items-center gap-4 w-full text-left hover:border-gray-600 transition-colors group"
    >
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bg)}>
        <Icon className={clsx('w-5 h-5', color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200">{label}</p>
        <p className="text-xs text-gray-500 truncate">{desc}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
    </button>
  )
}
