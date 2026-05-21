import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersService } from '@/services/users.service'
import { ShieldCheck, UserPlus, Check, KeyRound, X } from 'lucide-react'
import type { User } from '@/types'
import clsx from 'clsx'

const EMPTY_FORM = { first_name: '', last_name: '', email: '', username: '', password: '', confirm: '' }

export function ManagersPage() {
  const qc = useQueryClient()
  const [form, setForm] = useState(EMPTY_FORM)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Modal changement de mot de passe
  const [pwdModal, setPwdModal] = useState<User | null>(null)
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState('')

  const { data: managers = [], isLoading } = useQuery({
    queryKey: ['users', 'manager'],
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
      setForm(EMPTY_FORM)
      setError('')
    },
    onError: (e: Error) => {
      setError(e.message || 'Erreur lors de la création du manager.')
      setSuccess('')
    },
  })

  const mutPassword = useMutation({
    mutationFn: () => usersService.changePassword(pwdModal!.id, newPwd),
    onSuccess: () => {
      setPwdSuccess('Mot de passe mis à jour avec succès.')
      setPwdError('')
      setNewPwd('')
      setConfirmPwd('')
    },
    onError: (e: Error) => {
      setPwdError(e.message || 'Erreur lors de la mise à jour.')
      setPwdSuccess('')
    },
  })

  function submitCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (form.password !== form.confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (form.password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return }
    mutCreate.mutate()
  }

  function submitPassword(e: React.FormEvent) {
    e.preventDefault()
    setPwdError('')
    setPwdSuccess('')
    if (newPwd !== confirmPwd) { setPwdError('Les mots de passe ne correspondent pas.'); return }
    if (newPwd.length < 8) { setPwdError('Le mot de passe doit contenir au moins 8 caractères.'); return }
    mutPassword.mutate()
  }

  function openPwdModal(manager: User) {
    setPwdModal(manager)
    setNewPwd('')
    setConfirmPwd('')
    setPwdError('')
    setPwdSuccess('')
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Formulaire création */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <UserPlus className="w-4 h-4 text-violet-400" />
            <h2 className="font-semibold text-white">Créer un manager</h2>
          </div>

          <form onSubmit={submitCreate} className="space-y-3">
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

            {error && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
            {success && (
              <p className="text-sm text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />{success}
              </p>
            )}

            <button type="submit" disabled={mutCreate.isPending} className="btn-primary w-full justify-center mt-1">
              {mutCreate.isPending ? 'Création en cours…' : 'Créer le manager'}
            </button>
          </form>
        </div>

        {/* Liste des managers */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <h2 className="font-semibold text-white">Managers</h2>
            <span className="ml-auto badge bg-blue-500/20 text-blue-400">{managers.length}</span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-gray-800 rounded-lg" />
              ))}
            </div>
          ) : managers.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Aucun manager enregistré</p>
          ) : (
            <ul className="space-y-2">
              {managers.map(m => <ManagerRow key={m.id} manager={m} onChangePassword={() => openPwdModal(m)} />)}
            </ul>
          )}
        </div>
      </div>

      {/* Modal changement de mot de passe */}
      {pwdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-400" />
                <h3 className="font-semibold text-white">Modifier le mot de passe</h3>
              </div>
              <button onClick={() => setPwdModal(null)} className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="flex items-center gap-3 mb-5 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="w-9 h-9 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-sm font-bold uppercase shrink-0">
                  {(pwdModal.first_name?.[0] ?? pwdModal.email[0]).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {[pwdModal.first_name, pwdModal.last_name].filter(Boolean).join(' ') || pwdModal.username || pwdModal.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{pwdModal.email}</p>
                </div>
              </div>

              <form onSubmit={submitPassword} className="space-y-3">
                <div>
                  <label className="label">Nouveau mot de passe *</label>
                  <input
                    required type="password" className="input"
                    placeholder="Minimum 8 caractères"
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Confirmer le mot de passe *</label>
                  <input
                    required type="password" className="input"
                    placeholder="Répéter le mot de passe"
                    value={confirmPwd}
                    onChange={e => setConfirmPwd(e.target.value)}
                  />
                </div>

                {pwdError && <p className="text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{pwdError}</p>}
                {pwdSuccess && (
                  <p className="text-sm text-emerald-400 bg-emerald-500/10 rounded-lg px-3 py-2 flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0" />{pwdSuccess}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setPwdModal(null)} className="btn-ghost flex-1 justify-center">
                    Annuler
                  </button>
                  <button type="submit" disabled={mutPassword.isPending} className="btn-primary flex-1 justify-center">
                    {mutPassword.isPending ? 'Mise à jour…' : 'Mettre à jour'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ManagerRow({ manager, onChangePassword }: { manager: User; onChangePassword: () => void }) {
  const name = [manager.first_name, manager.last_name].filter(Boolean).join(' ') || manager.username || manager.email
  const initials = (manager.first_name?.[0] ?? manager.email[0]).toUpperCase()

  return (
    <li className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800/60 border border-gray-700/50 hover:border-gray-600 transition-colors">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 text-sm font-bold uppercase shrink-0">
        {initials}
      </div>

      {/* Infos */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-100 truncate">{name}</p>
        <p className="text-xs text-gray-500 truncate">{manager.email}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="badge bg-blue-500/20 text-blue-400 text-xs">Manager</span>
          <span className={clsx('badge text-xs', manager.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400')}>
            {manager.is_active ? 'Actif' : 'Inactif'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={onChangePassword}
        title="Modifier le mot de passe"
        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors shrink-0"
      >
        <KeyRound className="w-4 h-4" />
      </button>
    </li>
  )
}
