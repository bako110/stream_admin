import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contentService } from '@/services/content.service'
import { Drawer } from '@/components/ui/Drawer'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ImageUpload } from '@/components/ui/ImageUpload'
import type { Season } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { Plus, Trash2, Edit2, ChevronDown, ArrowLeft, ListVideo } from 'lucide-react'

const EMPTY_FORM = {
  number: 1, title: '', synopsis: '', year: new Date().getFullYear(), thumbnail_url: '',
}

export function SeasonsPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { user: me } = useAuth()
  const isAdmin = me?.role === 'admin'
  const [searchParams] = useSearchParams()
  const paramSerieId = searchParams.get('serieId') ?? ''
  const paramTitle = searchParams.get('title') ?? ''

  const [selectedSerieId, setSelectedSerieId] = useState(paramSerieId)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Season | null>(null)
  const [toDelete, setToDelete] = useState<{ number: number; title: string } | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (paramSerieId) setSelectedSerieId(paramSerieId)
  }, [paramSerieId])

  const { data: seriesData } = useQuery({
    queryKey: ['series-all-admin'],
    queryFn: () => contentService.listSeriesAdmin(1, 100),
  })

  const { data: seasons = [], isLoading } = useQuery({
    queryKey: ['seasons', selectedSerieId],
    queryFn: () => contentService.getSeasons(selectedSerieId),
    enabled: !!selectedSerieId,
  })

  const mutCreate = useMutation({
    mutationFn: () => contentService.createSeason(selectedSerieId, {
      number: form.number,
      title: form.title || undefined,
      synopsis: form.synopsis || undefined,
      year: form.year || undefined,
    }),
    onSuccess: async (season) => {
      if (form.thumbnail_url) {
        await contentService.updateSeason(selectedSerieId, season.number, { thumbnail_url: form.thumbnail_url })
      }
      qc.invalidateQueries({ queryKey: ['seasons'] })
      closeForm()
    },
  })

  const mutUpdate = useMutation({
    mutationFn: () => contentService.updateSeason(selectedSerieId, editing!.number, {
      title: form.title || undefined,
      synopsis: form.synopsis || undefined,
      year: form.year || undefined,
      thumbnail_url: form.thumbnail_url || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['seasons'] }); closeForm() },
  })

  const mutDelete = useMutation({
    mutationFn: ({ number }: { number: number }) => contentService.deleteSeason(selectedSerieId, number),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['seasons'] }); setToDelete(null) },
  })

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_FORM, number: seasons.length + 1 })
    setShowForm(true)
  }

  function openEdit(s: Season) {
    setEditing(s)
    setForm({
      number: s.number,
      title: s.title ?? '',
      synopsis: s.synopsis ?? '',
      year: s.year ?? new Date().getFullYear(),
      thumbnail_url: s.thumbnail_url ?? '',
    })
    setShowForm(true)
  }

  function closeForm() { setShowForm(false); setEditing(null) }

  const series = seriesData?.items ?? []
  const selectedSerie = series.find(s => s.id === selectedSerieId)
  const displayTitle = selectedSerie?.title ?? paramTitle
  const isPending = mutCreate.isPending || mutUpdate.isPending

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => navigate('/content/series')} className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-100 truncate">
            Saisons{displayTitle ? ` — ${displayTitle}` : ''}
          </h2>
          <p className="text-sm text-gray-500">{seasons.length} saison{seasons.length !== 1 ? 's' : ''}</p>
        </div>
        {selectedSerieId && (
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" />Ajouter une saison
          </button>
        )}
      </div>

      {/* Sélecteur de série */}
      <div className="card p-4">
        <label className="label">Série</label>
        <div className="relative max-w-sm">
          <select
            className="input appearance-none pr-8"
            value={selectedSerieId}
            onChange={e => setSelectedSerieId(e.target.value)}
          >
            <option value="">— Sélectionner une série —</option>
            {series.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {!selectedSerieId ? (
        <div className="card p-12 text-center text-gray-500">
          Sélectionnez une série pour gérer ses saisons
        </div>
      ) : (
        <>
          {/* Cartes — mobile uniquement */}
          <div className="md:hidden space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="card p-4 animate-pulse h-20" />)
            ) : seasons.length === 0 ? (
              <div className="card p-12 text-center text-gray-500">Aucune saison — créez la première</div>
            ) : seasons.map(s => (
              <div key={s.id} className="card p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {s.thumbnail_url ? (
                    <img src={s.thumbnail_url} alt="" className="w-11 h-11 object-cover rounded shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded bg-gray-800 flex items-center justify-center text-gray-500 text-xs font-bold shrink-0">
                      S{s.number}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-100 font-medium truncate">{s.title ? s.title : `Saison ${s.number}`}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {s.total_episodes} épisode{s.total_episodes !== 1 ? 's' : ''} · {s.year ?? '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1 pt-2 border-t border-gray-800">
                  <button
                    onClick={() => navigate(`/content/episodes?serieId=${selectedSerieId}&season=${s.number}&serieTitle=${encodeURIComponent(displayTitle)}`)}
                    title="Gérer les épisodes"
                    className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    <ListVideo className="w-4 h-4" />
                  </button>
                  <button onClick={() => openEdit(s)} title="Modifier" className="p-1.5 text-gray-400 hover:text-violet-400 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setToDelete({ number: s.number, title: s.title ?? `Saison ${s.number}` })}
                      title="Supprimer"
                      className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Table — desktop uniquement */}
          <div className="card overflow-hidden hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-4 py-3 text-gray-400 font-medium w-16">N°</th>
                  <th className="px-4 py-3 text-gray-400 font-medium">Saison</th>
                  <th className="px-4 py-3 text-gray-400 font-medium">Épisodes</th>
                  <th className="px-4 py-3 text-gray-400 font-medium">Année</th>
                  <th className="px-4 py-3 text-gray-400 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {isLoading ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-4 py-4"><div className="h-4 bg-gray-800 rounded w-3/4" /></td>
                  </tr>
                )) : seasons.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Aucune saison — créez la première</td></tr>
                ) : seasons.map(s => (
                  <tr key={s.id} className="table-row-hover">
                    <td className="px-4 py-3 text-gray-400 font-mono font-bold">{s.number}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {s.thumbnail_url ? (
                          <img src={s.thumbnail_url} alt="" className="w-10 h-10 object-cover rounded" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center text-gray-500 text-xs font-bold">
                            S{s.number}
                          </div>
                        )}
                        <p className="text-gray-100 font-medium">
                          {s.title ? s.title : `Saison ${s.number}`}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{s.total_episodes} épisode{s.total_episodes !== 1 ? 's' : ''}</td>
                    <td className="px-4 py-3 text-gray-400">{s.year ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => navigate(`/content/episodes?serieId=${selectedSerieId}&season=${s.number}&serieTitle=${encodeURIComponent(displayTitle)}`)}
                          title="Gérer les épisodes"
                          className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                        >
                          <ListVideo className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEdit(s)} title="Modifier" className="p-1.5 text-gray-400 hover:text-violet-400 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setToDelete({ number: s.number, title: s.title ?? `Saison ${s.number}` })}
                            title="Supprimer"
                            className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showForm && (
        <Drawer
          title={editing ? `Modifier la saison ${editing.number}` : 'Ajouter une saison'}
          onClose={closeForm}
        >
          <form onSubmit={e => { e.preventDefault(); editing ? mutUpdate.mutate() : mutCreate.mutate() }} className="space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Numéro *</label>
                  <input
                    required type="number" min="1" className="input"
                    value={form.number}
                    onChange={e => setForm(f => ({ ...f, number: Number(e.target.value) }))}
                    disabled={!!editing}
                  />
                </div>
                <div>
                  <label className="label">Année</label>
                  <input
                    type="number" min="1888" max="2099" className="input"
                    value={form.year}
                    onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div>
                <label className="label">Titre (optionnel)</label>
                <input
                  className="input" placeholder="ex: La résurrection"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Synopsis</label>
                <textarea
                  rows={3} className="input resize-none"
                  value={form.synopsis}
                  onChange={e => setForm(f => ({ ...f, synopsis: e.target.value }))}
                />
              </div>
            </div>
            <div className="border-t border-gray-800 pt-4">
              <ImageUpload
                label="Miniature de la saison"
                aspect="poster"
                value={form.thumbnail_url}
                onChange={url => setForm(f => ({ ...f, thumbnail_url: url }))}
              />
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
          title="Supprimer la saison"
          message={`Supprimer la saison « ${toDelete.title} » et tous ses épisodes ? Cette action est irréversible.`}
          confirmLabel="Supprimer" danger
          onConfirm={() => mutDelete.mutate({ number: toDelete.number })}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
