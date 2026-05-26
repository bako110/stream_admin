import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contentService } from '@/services/content.service'
import { Drawer } from '@/components/ui/Drawer'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { useAuth } from '@/contexts/AuthContext'
import type { Content } from '@/types'
import { Plus, Trash2, Globe, Edit2, Tv, Layers, Lock, ArrowLeft } from 'lucide-react'
import clsx from 'clsx'

const STATUS_COLORS = {
  draft: 'bg-gray-700 text-gray-300',
  published: 'bg-emerald-500/15 text-emerald-400',
  archived: 'bg-red-500/15 text-red-400',
}

const EMPTY = {
  title: '', original_title: '', director: '',
  year: new Date().getFullYear(), language: 'fr',
  synopsis: '', thumbnail_url: '', banner_url: '', trailer_url: '',
  is_premium: false, price: '',
}

export function SeriesPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Content | null>(null)
  const [toDelete, setToDelete] = useState<Content | null>(null)
  const [form, setForm] = useState(EMPTY)

  const { data, isLoading } = useQuery({
    queryKey: ['series', page],
    queryFn: () => contentService.listSeriesAdmin(page, 20),
  })

  const mutCreate = useMutation({
    mutationFn: () => contentService.createSerie({
      title: form.title,
      original_title: form.original_title || undefined,
      director: form.director || undefined,
      year: Number(form.year),
      language: form.language,
      synopsis: form.synopsis || undefined,
      thumbnail_url: form.thumbnail_url || undefined,
      banner_url: form.banner_url || undefined,
      trailer_url: form.trailer_url || undefined,
      is_premium: form.is_premium,
      price: form.is_premium && form.price ? Number(form.price) : null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['series'] }); closeForm() },
  })

  const mutUpdate = useMutation({
    mutationFn: () => contentService.updateSerie(editing!.id, {
      title: form.title,
      original_title: form.original_title || undefined,
      director: form.director || undefined,
      year: Number(form.year),
      language: form.language,
      synopsis: form.synopsis || undefined,
      thumbnail_url: form.thumbnail_url || undefined,
      banner_url: form.banner_url || undefined,
      trailer_url: form.trailer_url || undefined,
      is_premium: form.is_premium,
      price: form.is_premium && form.price ? Number(form.price) : null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['series'] }); closeForm() },
  })

  const mutPublish = useMutation({
    mutationFn: (id: string) => contentService.publishSerie(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['series'] }),
  })

  const mutDelete = useMutation({
    mutationFn: (id: string) => contentService.deleteSerie(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['series'] }); setToDelete(null) },
  })

  function openCreate() { setEditing(null); setForm(EMPTY); setShowForm(true) }

  function openEdit(s: Content) {
    setEditing(s)
    setForm({
      title: s.title,
      original_title: s.original_title ?? '',
      director: s.director ?? '',
      year: s.year, language: s.language,
      synopsis: s.synopsis ?? '',
      thumbnail_url: s.thumbnail_url ?? '', banner_url: s.banner_url ?? '',
      trailer_url: s.trailer_url ?? '',
      is_premium: s.is_premium, price: s.price != null ? String(s.price) : '',
    })
    setShowForm(true)
  }

  function closeForm() { setShowForm(false); setEditing(null) }

  const series = data?.items ?? []
  const totalPages = data ? Math.ceil(data.total / 20) : 1
  const isPending = mutCreate.isPending || mutUpdate.isPending

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <p className="text-gray-400 text-sm">{data?.total ?? 0} série{(data?.total ?? 0) !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" />Ajouter une série
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 text-gray-400 font-medium">Série</th>
                <th className="px-4 py-3 text-gray-400 font-medium">Année</th>
                <th className="px-4 py-3 text-gray-400 font-medium">Saisons</th>
                <th className="px-4 py-3 text-gray-400 font-medium">Statut</th>
                <th className="px-4 py-3 text-gray-400 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading ? Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={5} className="px-4 py-4"><div className="h-4 bg-gray-800 rounded w-3/4" /></td>
                </tr>
              )) : series.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Aucune série</td></tr>
              ) : series.map(serie => (
                <tr key={serie.id} className="table-row-hover">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {serie.thumbnail_url ? (
                        <img src={serie.thumbnail_url} alt="" className="w-10 h-14 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-14 rounded bg-gray-800 flex items-center justify-center">
                          <Tv className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-gray-100 font-medium">{serie.title}</p>
                          {serie.is_premium && <Lock className="w-3 h-3 text-amber-400" />}
                        </div>
                        {serie.is_premium && serie.price != null && (
                          <p className="text-xs text-amber-400/70">{serie.price} €</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{serie.year}</td>
                  <td className="px-4 py-3 text-gray-400">{serie.total_seasons ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('badge', STATUS_COLORS[serie.status])}>{serie.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const canEdit = isAdmin || serie.added_by === user?.id
                      return (
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => navigate(`/content/seasons?serieId=${serie.id}&title=${encodeURIComponent(serie.title)}`)}
                        title="Gérer les saisons"
                        className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        <Layers className="w-4 h-4" />
                      </button>
                      {serie.status !== 'published' && canEdit && (
                        <button onClick={() => mutPublish.mutate(serie.id)} title="Publier" className="p-1.5 text-gray-400 hover:text-emerald-400 transition-colors">
                          <Globe className="w-4 h-4" />
                        </button>
                      )}
                      {canEdit ? (
                        <button onClick={() => openEdit(serie)} title="Modifier" className="p-1.5 text-gray-400 hover:text-violet-400 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="px-2 py-1 text-xs text-gray-600 italic">Lecture seule</span>
                      )}
                      {canEdit && (
                        <button onClick={() => setToDelete(serie)} title="Supprimer" className="p-1.5 text-gray-400 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                      )
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-800 flex items-center gap-2 justify-end">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-ghost py-1 px-3 text-xs disabled:opacity-40">Précédent</button>
            <span className="text-xs text-gray-500">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-ghost py-1 px-3 text-xs disabled:opacity-40">Suivant</button>
          </div>
        )}
      </div>

      {showForm && (
        <Drawer title={editing ? 'Modifier la série' : 'Ajouter une série'} onClose={closeForm}>
          <form onSubmit={e => { e.preventDefault(); editing ? mutUpdate.mutate() : mutCreate.mutate() }} className="space-y-5">

            {/* Infos de base */}
            <div className="space-y-3">
              <div>
                <label className="label">Titre *</label>
                <input required className="input" placeholder="Titre de la série" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Titre original</label>
                <input className="input" placeholder="ex: Breaking Bad" value={form.original_title} onChange={e => setForm(f => ({ ...f, original_title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Année *</label>
                  <input required type="number" min="1888" max="2099" className="input" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="label">Langue</label>
                  <select className="input" value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
                    <option value="fr">Français</option>
                    <option value="en">Anglais</option>
                    <option value="es">Espagnol</option>
                    <option value="ar">Arabe</option>
                    <option value="wo">Wolof</option>
                    <option value="bm">Bambara</option>
                    <option value="ha">Haoussa</option>
                    <option value="sw">Swahili</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Créateur / Réalisateur</label>
                <input className="input" placeholder="ex: Vince Gilligan" value={form.director} onChange={e => setForm(f => ({ ...f, director: e.target.value }))} />
              </div>
              <div>
                <label className="label">Synopsis</label>
                <textarea rows={3} className="input resize-none" placeholder="Description de la série…" value={form.synopsis} onChange={e => setForm(f => ({ ...f, synopsis: e.target.value }))} />
              </div>
            </div>

            {/* Images */}
            <div className="border-t border-gray-800 pt-4 space-y-4">
              <ImageUpload label="Poster" aspect="poster" value={form.thumbnail_url} onChange={url => setForm(f => ({ ...f, thumbnail_url: url }))} />
              <ImageUpload label="Bannière" aspect="banner" value={form.banner_url} onChange={url => setForm(f => ({ ...f, banner_url: url }))} />
            </div>

            {/* Trailer */}
            <div>
              <label className="label">Lien Trailer (YouTube, Vimeo…)</label>
              <input className="input" placeholder="https://youtube.com/watch?v=…" value={form.trailer_url} onChange={e => setForm(f => ({ ...f, trailer_url: e.target.value }))} />
            </div>

            {/* Premium */}
            <div className="border-t border-gray-800 pt-4">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, is_premium: !f.is_premium, price: '' }))}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors text-sm font-medium',
                  form.is_premium
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                    : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                )}
              >
                <Lock className="w-4 h-4" />
                <span className="flex-1 text-left">Contenu premium</span>
                <div className={clsx('w-9 h-5 rounded-full transition-colors relative', form.is_premium ? 'bg-amber-500' : 'bg-gray-600')}>
                  <div className={clsx('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all', form.is_premium ? 'left-4' : 'left-0.5')} />
                </div>
              </button>
              {form.is_premium && (
                <div className="mt-3">
                  <label className="label">Prix d'achat (€)</label>
                  <input
                    type="number" min="0" step="0.01" className="input"
                    placeholder="ex: 4.99"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-gray-800">
              <button type="button" onClick={closeForm} className="btn-ghost">Annuler</button>
              <button type="submit" disabled={isPending} className="btn-primary">
                {isPending ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Créer la série'}
              </button>
            </div>
          </form>
        </Drawer>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Supprimer la série"
          message={`Supprimer « ${toDelete.title} » et toutes ses saisons/épisodes ? Cette action est irréversible.`}
          confirmLabel="Supprimer" danger
          onConfirm={() => mutDelete.mutate(toDelete.id)}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
