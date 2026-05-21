import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Film, Tv, Layers, ListVideo, LogOut, ShieldCheck, BadgeCheck, Flag, UsersRound,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import clsx from 'clsx'

const NAV_ADMIN = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users, label: 'Utilisateurs' },
  { to: '/communities', icon: UsersRound, label: 'Communautés' },
  { to: '/content/films', icon: Film, label: 'Films' },
  { to: '/content/series', icon: Tv, label: 'Séries' },
  { to: '/content/seasons', icon: Layers, label: 'Saisons' },
  { to: '/content/episodes', icon: ListVideo, label: 'Épisodes' },
  { to: '/managers', icon: ShieldCheck, label: 'Managers' },
  { to: '/verification', icon: BadgeCheck, label: 'Vérifications' },
  { to: '/reports', icon: Flag, label: 'Signalements' },
]

const NAV_MANAGER = [
  { to: '/content/films', icon: Film, label: 'Films' },
  { to: '/content/series', icon: Tv, label: 'Séries' },
  { to: '/content/seasons', icon: Layers, label: 'Saisons' },
  { to: '/content/episodes', icon: ListVideo, label: 'Épisodes' },
]

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  manager: 'Manager',
}

export function Sidebar() {
  const { user, logout } = useAuth()
  const isManager = user?.role === 'manager'
  const NAV = isManager ? NAV_MANAGER : NAV_ADMIN

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-gray-900 border-r border-gray-800 flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
          S
        </div>
        <span className="font-semibold text-white">StreamAdmin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-violet-600/20 text-violet-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Utilisateur connecté */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-violet-600/30 flex items-center justify-center text-violet-400 text-xs font-bold uppercase shrink-0">
            {user?.first_name?.[0] ?? user?.email?.[0] ?? 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate">
              {user?.display_name ?? (`${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || user?.email)}
            </p>
            <p className="text-xs text-gray-500 truncate">{ROLE_LABELS[user?.role ?? ''] ?? user?.role}</p>
          </div>
        </div>
        <button onClick={logout} className="btn-ghost w-full justify-start text-xs py-2">
          <LogOut className="w-3.5 h-3.5" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
