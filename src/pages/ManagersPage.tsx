import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersService } from '@/services/users.service'
import { ShieldCheck, UserPlus, Check } from 'lucide-react'

const EMPTY = { first_name: '', last_name: '', email: '', username: '', password: '', confirm: '' }

export function ManagersPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState(EMPTY)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ['users', 'admin'],
    queryFn: () => usersService.list(1, 100, 'manager'),
  })

  const mutCreate = useMutation({
    mutationFn: () => usersService.createManager({
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      password: form.password,
      username: form.username || undefined,
    }),
    onSuccess: (user) => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setSuccess(`Manager « ${user.email} » créé avec succès.`)
      setForm(EMPTY)
      setError('')
    },
    onError: (e: Error) => {
      setError(e.message || 'Erreur lors de la création du manager.')
      setSuccess('')
    },
  })

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    mutCreate.mutate()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Formulaire */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <UserPlus className="w-4 h-4 text-violet-400" />
          <h2 className="font-semibold text-white">Créer un manager</h2>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Prénom *</label>
              <input required className="input" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Nom *</label>
              <input required className="input" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="label">Email *</label>
            <input required type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>

          <div>
            <label className="label">Username (optionnel)</label>
            <input className="input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
          </div>

          <div>
            <label className="label">Mot de passe *</label>
            <input required type="password" className="input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>

          <div>
            <label className="label">Confirmer le mot de passe *</label>
            <input required type="password" className="input" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
          )}
          {success && (
            <p className="text-sm text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              {success}
            </p>
          )}

          <button type="submit" disabled={mutCreate.isPending} className="btn-primary w-full justify-center mt-1">
            {mutCreate.isPending ? 'Création en cours…' : 'Créer le manager'}
          </button>
        </form>
      </div>

      {/* Liste des admins existants */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <ShieldCheck className="w-4 h-4 text-violet-400" />
          <h2 className="font-semibold text-white">Managers actuels</h2>
          <span className="ml-auto badge bg-violet-500/20 text-violet-400">{admins.length}</span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse h-12 bg-gray-800 rounded-lg" />
            ))}
          </div>
        ) : admins.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">Aucun manager enregistré</p>
        ) : (
          <ul className="space-y-2">
            {admins.map(u => (
              <li key={u.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-800/50">
                <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-violet-400 text-xs font-bold uppercase shrink-0">
                  {(u.first_name?.[0] ?? u.email[0]).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {[u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || u.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                <span className={`ml-auto badge shrink-0 ${u.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                  {u.is_active ? 'Actif' : 'Inactif'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
