import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersService } from '@/services/users.service'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { UserContentDrawer } from '@/components/users/UserContentDrawer'
import { useAuth } from '@/contexts/AuthContext'
import type { User, UserRole } from '@/types'
import { UserCheck, UserX, Trash2, Search, RefreshCw, LayoutGrid } from 'lucide-react'
import clsx from 'clsx'

const ROLE_COLORS: Record<UserRole, string> = {
  user: 'bg-gray-700 text-gray-300',
  artist: 'bg-amber-500/20 text-amber-400',
  manager: 'bg-blue-500/20 text-blue-400',
  admin: 'bg-violet-500/20 text-violet-400',
}

const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Utilisateur',
  artist: 'Artiste',
  manager: 'Manager',
  admin: 'Admin',
}

const ROLES: UserRole[] = ['user', 'artist', 'manager', 'admin']

export function UsersPage() {
  const qc = useQueryClient()
  const { user: me } = useAuth()
  const isAdmin = me?.role === 'admin'
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [confirm, setConfirm]         = useState<{ action: string; userId: string; label: string } | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ['users', roleFilter],
    queryFn: () => usersService.list(1, 100, roleFilter || undefined),
    // Un utilisateur peut se (dés)activer/supprimer lui-même depuis le mobile — l'admin
    // doit refléter ce changement externe sans dépendre d'un clic manuel sur Actualiser.
    refetchInterval: 30_000,
  })

  const mutActivate = useMutation({
    mutationFn: (id: string) => usersService.activate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
  const mutDeactivate = useMutation({
    mutationFn: (id: string) => usersService.deactivate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
  const mutDelete = useMutation({
    mutationFn: (id: string) => usersService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
  const mutRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => usersService.changeRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return (
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.username ?? '').toLowerCase().includes(q) ||
      (u.first_name ?? '').toLowerCase().includes(q) ||
      (u.last_name ?? '').toLowerCase().includes(q)
    )
  })

  function handleConfirm() {
    if (!confirm) return
    if (confirm.action === 'activate') mutActivate.mutate(confirm.userId)
    if (confirm.action === 'deactivate') mutDeactivate.mutate(confirm.userId)
    if (confirm.action === 'delete') mutDelete.mutate(confirm.userId)
    setConfirm(null)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            className="input pl-9"
            placeholder="Rechercher par email, nom, username…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input w-40"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="">Tous les rôles</option>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <button onClick={() => refetch()} className="btn-ghost p-2">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Cartes — mobile uniquement */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse h-24" />
          ))
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center text-gray-500">Aucun utilisateur trouvé</div>
        ) : (
          filtered.map(user => (
            <UserCard
              key={user.id}
              user={user}
              isAdmin={isAdmin}
              onViewContent={() => setSelectedUser(user)}
              onActivate={() => setConfirm({ action: 'activate', userId: user.id, label: `Activer ${user.email}` })}
              onDeactivate={() => setConfirm({ action: 'deactivate', userId: user.id, label: `Désactiver ${user.email}` })}
              onDelete={() => setConfirm({ action: 'delete', userId: user.id, label: `Supprimer définitivement ${user.email}` })}
              onRoleChange={(role) => mutRole.mutate({ id: user.id, role })}
            />
          ))
        )}
        {!isLoading && filtered.length > 0 && (
          <p className="text-xs text-gray-500 text-center">{filtered.length} utilisateur{filtered.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      {/* Table — desktop uniquement */}
      <div className="card overflow-hidden hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left">
              <th className="px-4 py-3 text-gray-400 font-medium">Utilisateur</th>
              <th className="px-4 py-3 text-gray-400 font-medium">Rôle</th>
              <th className="px-4 py-3 text-gray-400 font-medium">Statut</th>
              <th className="px-4 py-3 text-gray-400 font-medium">Inscrit le</th>
              <th className="px-4 py-3 text-gray-400 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-4 py-4">
                    <div className="h-4 bg-gray-800 rounded w-3/4" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              filtered.map(user => <UserRow
                key={user.id}
                user={user}
                isAdmin={isAdmin}
                onViewContent={() => setSelectedUser(user)}
                onActivate={() => setConfirm({ action: 'activate', userId: user.id, label: `Activer ${user.email}` })}
                onDeactivate={() => setConfirm({ action: 'deactivate', userId: user.id, label: `Désactiver ${user.email}` })}
                onDelete={() => setConfirm({ action: 'delete', userId: user.id, label: `Supprimer définitivement ${user.email}` })}
                onRoleChange={(role) => mutRole.mutate({ id: user.id, role })}
              />)
            )}
          </tbody>
        </table>
        {!isLoading && (
          <div className="px-4 py-2 border-t border-gray-800 text-xs text-gray-500">
            {filtered.length} utilisateur{filtered.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          title="Confirmer l'action"
          message={confirm.label}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
          danger={confirm.action === 'delete'}
        />
      )}

      {selectedUser && (
        <UserContentDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  )
}

interface UserRowProps {
  user: User
  isAdmin: boolean
  onViewContent: () => void
  onActivate: () => void
  onDeactivate: () => void
  onDelete: () => void
  onRoleChange: (role: UserRole) => void
}

function UserRow({ user, isAdmin, onViewContent, onActivate, onDeactivate, onDelete, onRoleChange }: UserRowProps) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || '—'

  return (
    <tr className="table-row-hover">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 text-xs font-bold uppercase shrink-0">
            {(user.first_name?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
          </div>
          <div>
            <p className="text-gray-100 font-medium">{name}</p>
            <p className="text-gray-500 text-xs">{user.email ?? '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <select
          value={user.role}
          onChange={e => onRoleChange(e.target.value as UserRole)}
          className={clsx('badge border-0 cursor-pointer bg-transparent text-xs', ROLE_COLORS[user.role])}
        >
          {ROLES.map(r => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <span
          className={clsx('badge', user.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400')}
          title={!user.is_active ? (user.is_deleted ? user.deletion_reason ?? undefined : user.deactivation_reason ?? undefined) : undefined}
        >
          {user.is_active ? 'Actif' : user.is_deleted ? 'Supprimé' : 'Inactif'}
        </span>
        {!user.is_active && (user.is_deleted ? user.deletion_reason : user.deactivation_reason) && (
          <div className="text-xs text-gray-500 mt-1 max-w-[160px] truncate">
            {user.is_deleted ? user.deletion_reason : user.deactivation_reason}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-gray-400 text-xs">
        {new Date(user.created_at).toLocaleDateString('fr-FR')}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end">
          <button onClick={onViewContent} title="Voir le contenu" className="p-1.5 text-gray-400 hover:text-violet-400 transition-colors">
            <LayoutGrid className="w-4 h-4" />
          </button>
          {user.is_active ? (
            <button onClick={onDeactivate} title="Désactiver" className="p-1.5 text-gray-400 hover:text-amber-400 transition-colors">
              <UserX className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={onActivate} title="Activer" className="p-1.5 text-gray-400 hover:text-emerald-400 transition-colors">
              <UserCheck className="w-4 h-4" />
            </button>
          )}
          {isAdmin && (
            <button onClick={onDelete} title="Supprimer" className="p-1.5 text-gray-400 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

function UserCard({ user, isAdmin, onViewContent, onActivate, onDeactivate, onDelete, onRoleChange }: UserRowProps) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || '—'

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 text-xs font-bold uppercase shrink-0">
          {(user.first_name?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-gray-100 font-medium truncate">{name}</p>
          <p className="text-gray-500 text-xs truncate">{user.email ?? '—'}</p>
        </div>
        <span
          className={clsx('badge shrink-0', user.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400')}
        >
          {user.is_active ? 'Actif' : user.is_deleted ? 'Supprimé' : 'Inactif'}
        </span>
      </div>

      {!user.is_active && (user.is_deleted ? user.deletion_reason : user.deactivation_reason) && (
        <p className="text-xs text-gray-500">
          {user.is_deleted ? user.deletion_reason : user.deactivation_reason}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-800">
        <select
          value={user.role}
          onChange={e => onRoleChange(e.target.value as UserRole)}
          className={clsx('badge border-0 cursor-pointer bg-transparent text-xs', ROLE_COLORS[user.role])}
        >
          {ROLES.map(r => (
            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
          ))}
        </select>
        <span className="text-xs text-gray-500">
          Inscrit le {new Date(user.created_at).toLocaleDateString('fr-FR')}
        </span>
      </div>

      <div className="flex items-center gap-1 justify-end pt-1">
        <button onClick={onViewContent} title="Voir le contenu" className="p-1.5 text-gray-400 hover:text-violet-400 transition-colors">
          <LayoutGrid className="w-4 h-4" />
        </button>
        {user.is_active ? (
          <button onClick={onDeactivate} title="Désactiver" className="p-1.5 text-gray-400 hover:text-amber-400 transition-colors">
            <UserX className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={onActivate} title="Activer" className="p-1.5 text-gray-400 hover:text-emerald-400 transition-colors">
            <UserCheck className="w-4 h-4" />
          </button>
        )}
        {isAdmin && (
          <button onClick={onDelete} title="Supprimer" className="p-1.5 text-gray-400 hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
