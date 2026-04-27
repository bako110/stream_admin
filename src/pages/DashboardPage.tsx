import { useQuery } from '@tanstack/react-query'
import { contentService } from '@/services/content.service'
import {
  Users, Film, Tv, Music2, CalendarDays, Play,
  CreditCard, BadgeCheck, TrendingUp,
} from 'lucide-react'
import clsx from 'clsx'

interface StatCardProps {
  label: string
  value: number | undefined
  icon: React.ElementType
  color: string
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-gray-400 text-sm">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">
          {value?.toLocaleString('fr-FR') ?? '—'}
        </p>
      </div>
    </div>
  )
}

export function DashboardPage() {
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

  const stats: StatCardProps[] = [
    { label: 'Utilisateurs', value: data?.users, icon: Users, color: 'bg-blue-500/15 text-blue-400' },
    { label: 'Films', value: data?.films, icon: Film, color: 'bg-violet-500/15 text-violet-400' },
    { label: 'Séries', value: data?.series, icon: Tv, color: 'bg-pink-500/15 text-pink-400' },
    { label: 'Concerts', value: data?.concerts, icon: Music2, color: 'bg-amber-500/15 text-amber-400' },
    { label: 'Événements', value: data?.events, icon: CalendarDays, color: 'bg-emerald-500/15 text-emerald-400' },
    { label: 'Reels', value: data?.reels, icon: Play, color: 'bg-cyan-500/15 text-cyan-400' },
    { label: 'Paiements', value: data?.payments, icon: CreditCard, color: 'bg-orange-500/15 text-orange-400' },
    { label: 'Abonnements actifs', value: data?.subscriptions, icon: BadgeCheck, color: 'bg-teal-500/15 text-teal-400' },
  ]

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={clsx(isLoading && 'animate-pulse')}>
            <StatCard {...s} value={isLoading ? undefined : s.value} />
          </div>
        ))}
      </div>

      {/* Résumé rapide */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-violet-400" />
          <h2 className="font-semibold text-white">Aperçu du contenu</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-3xl font-bold text-violet-400">{data?.contents ?? '—'}</p>
            <p className="text-sm text-gray-400 mt-1">Contenus total</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-3xl font-bold text-emerald-400">{data?.subscriptions ?? '—'}</p>
            <p className="text-sm text-gray-400 mt-1">Abonnés actifs</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-3xl font-bold text-amber-400">{data?.payments ?? '—'}</p>
            <p className="text-sm text-gray-400 mt-1">Transactions</p>
          </div>
        </div>
      </div>
    </div>
  )
}
