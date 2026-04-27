import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { contentService } from '@/services/content.service'
import { Drawer } from '@/components/ui/Drawer'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { VideoUpload } from '@/components/ui/VideoUpload'
import type { Episode } from '@/types'
import { Plus, Trash2, Edit2, ChevronDown, ArrowLeft } from 'lucide-react'
import clsx from 'clsx'

const EMPTY_FORM = {
  number: 1, title: '', synopsis: '', is_free: false,
  thumbnail_url: '', video_url: '', duration_sec: 0,
}

export function EpisodesPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const paramSerieId = searchParams.get('serieId') ?? ''
  const paramSeason = Number(searchParams.get('season') ?? '1')
  const paramSerieTitle = searchParams.get('serieTitle') ?? ''

  const [selectedSerieId, setSelectedSerieId] = useState(paramSerieId)
  const [selectedSeason, setSelectedSeason] = useState(paramSeason || 1)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Episode | null>(null)
  const [toDelete, setToDelete] = useState<Episode | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    if (paramSerieId) setSelectedSerieId(paramSerieId)
    if (paramSeason) setSelectedSeason(paramSeason)
  }, [paramSerieId, paramSeason])

  const { data: seriesData } = useQuery({
    queryKey: ['series-all-admin'],
    queryFn: () => contentService.listSeriesAdmin(1, 100),
  })

  const { data: seasons = [] } = useQuery({
    queryKey: ['seasons', selectedSerieId],
    queryFn: () => contentService.getSeasons(selectedSerieId),
    enabled: !!selectedSerieId,
  })

  const { data: episodes = [], isLoading: epLoading } = useQuery({
    queryKey: ['episodes', selectedSerieId, selectedSeason],
    queryFn: () => contentService.getEpisodes(selectedSerieId, selectedSeason),
    enabled: !!selectedSerieId,
  })

  const mutCreate = useMutation({
    mutationFn: () => contentService.createEpisode(selectedSerieId, selectedSeason, {
      number: form.number,
      title: form.title,
      synopsis: form.synopsis || undefined,
      is_free: form.is_free,
      thumbnail_url: form.thumbnail_url || undefined,
      video_url: form.video_url || undefined,
      duration_sec: form.duration_sec || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['episodes'] }); closeForm() },
  })

  const mutUpdate = useMutation({
    mutationFn: () => contentService.updateEpisode(editing!.id, {
      title: form.title,
      synopsis: form.synopsis || undefined,
      is_free: form.is_free,
      thumbnail_url: form.thumbnail_url || undefined,
      video_url: form.video_url || undefined,
      duration_sec: form.duration_sec || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['episodes'] }); closeForm() },
  })

  const mutDelete = useMutation({
    mutationFn: (id: string) => contentService.deleteEpisode(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['episodes'] }); setToDelete(null) },
  })

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY_FORM, number: episodes.length + 1 })
    setShowForm(true)
  }

  function openEdit(ep: Episode) {
    setEditing(ep)
    setForm({
      number: ep.number, title: ep.title, synopsis: ep.synopsis ?? '',
      is_free: ep.is_free, thumbnail_url: ep.thumbnail_url ?? '',
      video_url: ep.video_url ?? '', duration_sec: ep.duration_sec ?? 0,
    })
    setShowForm(true)
  }

  function closeForm() { setShowForm(false); setEditing(null) }

  const series = seriesData?.items ?? []
  const selectedSerie = series.find(s => s.id === selectedSerieId)
  const displayTitle = selectedSerie?.title ?? paramSerieTitle
  const isPending = mutCreate.isPending || mutUpdate.isPending

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        {paramSerieId ? (
          <button
            onClick={() => navigate(`/content/seasons?serieId=${paramSerieId}&title=${encodeURIComponent(displayTitle)}`)}
            className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : null}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-100">
            Épisodes{displayTitle ? ` — ${displayTitle}` : ''}
            {selectedSeason ? ` · Saison ${selectedSeason}` : ''}
          </h2>
          <p className="text-sm text-gray-500">{episodes.length} épisode{episodes.length !== 1 ? 's' : ''}</p>
        </div>
        {selectedSerieId && (
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" />Ajouter un épisode
          </button>
        )}
      </div>

      {/* Sélecteurs */}
      <div className="card p-4 flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-48">
          <label className="label">Série</label>
          <div className="relative">
            <select
              className="input appearance-none pr-8"
              value={selectedSerieId}
              onChange={e => { setSelectedSerieId(e.target.value); setSelectedSeason(1) }}
            >
              <option value="">— Sélectionner une série —</option>
              {series.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>

        {seasons.length > 0 && (
          <div className="w-52">
            <label className="label">Saison</label>
            <div className="relative">
              <select
                className="input appearance-none pr-8"
                value={selectedSeason}
                onChange={e => setSelectedSeason(Number(e.target.value))}
              >
                {seasons.map(s => (
                  <option key={s.id} value={s.number}>
                    Saison {s.number}{s.title ? ` — ${s.title}` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {!selectedSerieId ? (
        <div className="card p-12 text-center text-gray-500">
          Sélectionnez une série pour voir ses épisodes
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-4 py-3 text-gray-400 font-medium w-16">N°</th>
                  <th className="px-4 py-3 text-gray-400 font-medium">Épisode</th>
                  <th className="px-4 py-3 text-gray-400 font-medium">Durée</th>
                  <th className="px-4 py-3 text-gray-400 font-medium">Accès</th>
                  <th className="px-4 py-3 text-gray-400 font-medium">Vues</th>
                  <th className="px-4 py-3 text-gray-400 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {epLoading ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-4 py-4"><div className="h-4 bg-gray-800 rounded w-3/4" /></td>
                  </tr>
                )) : episodes.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Aucun épisode dans cette saison</td></tr>
                ) : episodes.map(ep => (
                  <tr key={ep.id} className="table-row-hover">
                    <td className="px-4 py-3 text-gray-400 font-mono">{String(ep.number).padStart(2, '0')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {ep.thumbnail_url ? (
                          <img src={ep.thumbnail_url} alt="" className="w-16 h-9 object-cover rounded" />
                        ) : (
                          <div className="w-16 h-9 rounded bg-gray-800" />
                        )}
                        <div>
                          <p className="text-gray-100 font-medium">{ep.title}</p>
                          {ep.synopsis && <p className="text-gray-500 text-xs truncate max-w-xs">{ep.synopsis}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {ep.duration_sec ? `${Math.floor(ep.duration_sec / 60)} min` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('badge', ep.is_free ? 'bg-emerald-500/15 text-emerald-400' : 'bg-violet-500/15 text-violet-400')}>
                        {ep.is_free ? 'Gratuit' : 'Premium'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{ep.view_count.toLocaleString('fr-FR')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(ep)} className="p-1.5 text-gray-400 hover:text-violet-400 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setToDelete(ep)} className="p-1.5 text-gray-400 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <Drawer
          title={editing ? `Modifier E${editing.number} — ${editing.title}` : 'Ajouter un épisode'}
          onClose={closeForm}
        >
          <form onSubmit={e => { e.preventDefault(); editing ? mutUpdate.mutate() : mutCreate.mutate() }} className="space-y-4">
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
              <div className="col-span-2">
                <label className="label">Titre *</label>
                <input required className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="label">Synopsis</label>
                <textarea rows={2} className="input resize-none" value={form.synopsis} onChange={e => setForm(f => ({ ...f, synopsis: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <input id="free-ep" type="checkbox" className="w-4 h-4 accent-violet-600" checked={form.is_free} onChange={e => setForm(f => ({ ...f, is_free: e.target.checked }))} />
                <label htmlFor="free-ep" className="text-sm text-gray-300 cursor-pointer">Épisode gratuit</label>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-4">
              <ImageUpload
                label="Miniature de l'épisode (16:9)"
                aspect="banner"
                value={form.thumbnail_url}
                onChange={url => setForm(f => ({ ...f, thumbnail_url: url }))}
              />
            </div>

            <div className="border-t border-gray-800 pt-4">
              <VideoUpload
                label="Fichier vidéo"
                value={form.video_url}
                onChange={(url, thumbUrl, dur) => setForm(f => ({
                  ...f,
                  video_url: url,
                  thumbnail_url: thumbUrl && !f.thumbnail_url ? thumbUrl : f.thumbnail_url,
                  duration_sec: dur ?? f.duration_sec,
                }))}
              />
              {form.duration_sec > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Durée détectée : {Math.floor(form.duration_sec / 60)} min {form.duration_sec % 60} s
                </p>
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
          title="Supprimer l'épisode"
          message={`Supprimer définitivement l'épisode ${toDelete.number} — « ${toDelete.title} » ?`}
          confirmLabel="Supprimer" danger
          onConfirm={() => mutDelete.mutate(toDelete.id)}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  )
}
