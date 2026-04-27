import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contentService } from '@/services/content.service'
import { Drawer } from '@/components/ui/Drawer'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ImageUpload } from '@/components/ui/ImageUpload'
import type { Content } from '@/types'
import { Plus, Trash2, Globe, Edit2, Film } from 'lucide-react'
import clsx from 'clsx'

const STATUS_COLORS = {
  draft: 'bg-gray-700 text-gray-300',
  published: 'bg-emerald-500/15 text-emerald-400',
  archived: 'bg-red-500/15 text-red-400',
}

const EMPTY_FORM = {
  title: '', original_title: '', year: new Date().getFullYear(), synopsis: '',
  director: '', language: 'fr', country: '', rating: '',
  thumbnail_url: '', banner_url: '', trailer_url: '',
  is_premium: false, price: '',
}

export function FilmsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Content | null>(null)
  const [toDelete, setToDelete] = useState<Content | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const { data, isLoading } = useQuery({
    queryKey: ['films', page],
    queryFn: () => contentService.listFilmsAdmin(page, 20),
  })

  const mutCreate = useMutation({
    mutationFn: () => contentService.createFilm({
      ...form, year: Number(form.year),
      price: form.price ? Number(form.price) : null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['films'] }); closeForm() },
  })

  const mutUpdate = useMutation({
    mutationFn: () => contentService.updateFilm(editing!.id, {
      ...form, year: Number(form.year),
      price: form.price ? Number(form.price) : null,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['films'] }); closeForm() },
  })

  const mutPublish = useMutation({
    mutationFn: (id: string) => contentService.publishFilm(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['films'] }),
  })

  const mutDelete = useMutation({
    mutationFn: (id: string) => contentService.deleteFilm(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['films'] }); setToDelete(null) },
  })

  function openCreate() {
    setEditing(null); setForm(EMPTY_FORM); setShowForm(true)
  }

  function openEdit(film: Content) {
    setEditing(film)
    setForm({
      title: film.title, original_title: film.original_title ?? '',
      year: film.year, synopsis: film.synopsis ?? '',
      director: film.director ?? '', language: film.language,
      country: film.country ?? '', rating: film.rating ?? '',
      thumbnail_url: film.thumbnail_url ?? '', banner_url: film.banner_url ?? '',
      trailer_url: film.trailer_url ?? '', is_premium: film.is_premium,
      price: film.price != null ? String(film.price) : '',
    })
    setShowForm(true)
  }

  function closeForm() { setShowForm(false); setEditing(null) }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    editing ? mutUpdate.mutate() : mutCreate.mutate()
  }

  const films = data?.items ?? []
  const totalPages = data ? Math.ceil(data.total / 20) : 1
  const isPending = mutCreate.isPending || mutUpdate.isPending

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-gray-400 text-sm">{data?.total ?? 0} film{(data?.total ?? 0) !== 1 ? 's' : ''}</p>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" />Ajouter un film
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 text-gray-400 font-medium">Film</th>
                <th className="px-4 py-3 text-gray-400 font-medium">Année</th>
                <th className="px-4 py-3 text-gray-400 font-medium">Langue</th>
                <th className="px-4 py-3 text-gray-400 font-medium">Statut</th>
                <th className="px-4 py-3 text-gray-400 font-medium">Vues</th>
                <th className="px-4 py-3 text-gray-400 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={6} className="px-4 py-4"><div className="h-4 bg-gray-800 rounded w-3/4" /></td>
                </tr>
              )) : films.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Aucun film</td></tr>
              ) : films.map(film => (
                <tr key={film.id} className="table-row-hover">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {film.thumbnail_url ? (
                        <img src={film.thumbnail_url} alt="" className="w-10 h-14 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-14 rounded bg-gray-800 flex items-center justify-center">
                          <Film className="w-4 h-4 text-gray-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-gray-100 font-medium">{film.title}</p>
                        {film.director && <p className="text-gray-500 text-xs">{film.director}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{film.year}</td>
                  <td className="px-4 py-3 text-gray-400 uppercase text-xs">{film.language}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('badge', STATUS_COLORS[film.status])}>{film.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{film.view_count.toLocaleString('fr-FR')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {film.status !== 'published' && (
                        <button onClick={() => mutPublish.mutate(film.id)} title="Publier" className="p-1.5 text-gray-400 hover:text-emerald-400 transition-colors">
                          <Globe className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => openEdit(film)} title="Modifier" className="p-1.5 text-gray-400 hover:text-violet-400 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setToDelete(film)} title="Supprimer" className="p-1.5 text-gray-400 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
        <Drawer title={editing ? 'Modifier le film' : 'Ajouter un film'} onClose={closeForm}>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="label">Titre *</label>
                <input required className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Titre original</label>
                <input className="input" value={form.original_title} onChange={e => setForm(f => ({ ...f, original_title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Année *</label>
                <input required type="number" min="1888" max="2099" className="input" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Langue</label>
                <input className="input" value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} />
              </div>
              <div>
                <label className="label">Pays</label>
                <input className="input" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
              </div>
              <div>
                <label className="label">Réalisateur</label>
                <input className="input" value={form.director} onChange={e => setForm(f => ({ ...f, director: e.target.value }))} />
              </div>
              <div>
                <label className="label">Classification</label>
                <input className="input" placeholder="PG-13, R…" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="label">Synopsis</label>
                <textarea rows={3} className="input resize-none" value={form.synopsis} onChange={e => setForm(f => ({ ...f, synopsis: e.target.value }))} />
              </div>
            </div>

            {/* Images */}
            <div className="border-t border-gray-800 pt-4 grid grid-cols-2 gap-4">
              <ImageUpload
                label="Miniature (poster)"
                aspect="poster"
                value={form.thumbnail_url}
                onChange={url => setForm(f => ({ ...f, thumbnail_url: url }))}
              />
              <ImageUpload
                label="Bannière"
                aspect="banner"
                value={form.banner_url}
                onChange={url => setForm(f => ({ ...f, banner_url: url }))}
              />
            </div>

            <div>
              <label className="label">URL Trailer (YouTube, Vimeo…)</label>
              <input className="input" placeholder="https://youtube.com/…" value={form.trailer_url} onChange={e => setForm(f => ({ ...f, trailer_url: e.target.value }))} />
            </div>

            <div className="flex items-center gap-2">
              <input id="premium-f" type="checkbox" className="w-4 h-4 accent-violet-600" checked={form.is_premium} onChange={e => setForm(f => ({ ...f, is_premium: e.target.checked }))} />
              <label htmlFor="premium-f" className="text-sm text-gray-300 cursor-pointer">Contenu premium</label>
              {form.is_premium && (
                <input type="number" min="0" step="0.01" className="input w-28 ml-2" placeholder="Prix €" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              )}
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-gray-800">
              <button type="button" onClick={closeForm} className="btn-ghost">Annuler</button>
              <button type="submit" disabled={isPending} className="btn-primary">
                {isPending ? 'Enregistrement…' : editing ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </form>
        </Drawer>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Supprimer le film"
          message={`Supprimer définitivement « ${toDelete.title} » ? Cette action est irréversible.`}
          confirmLabel="Supprimer" danger
          onConfirm={() => mutDelete.mutate(toDelete.id)}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
