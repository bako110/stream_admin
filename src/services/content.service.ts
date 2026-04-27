import api from '@/lib/api'
import type { Content, ContentListResponse, DashboardStats, Episode, Season } from '@/types'

export const contentService = {
  async getDashboard(): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>('/content/dashboard')
    return data
  },

  async listAll(): Promise<Content[]> {
    const { data } = await api.get<Content[]>('/content/all')
    return data
  },

  async listFilms(page = 1, limit = 20): Promise<ContentListResponse> {
    const { data } = await api.get<ContentListResponse>('/content/films', { params: { page, limit } })
    return data
  },

  async listFilmsAdmin(page = 1, limit = 20): Promise<ContentListResponse> {
    const { data } = await api.get<ContentListResponse>('/content/films/admin', { params: { page, limit } })
    return data
  },

  async listSeries(page = 1, limit = 20): Promise<ContentListResponse> {
    const { data } = await api.get<ContentListResponse>('/content/series', { params: { page, limit } })
    return data
  },

  async listSeriesAdmin(page = 1, limit = 20): Promise<ContentListResponse> {
    const { data } = await api.get<ContentListResponse>('/content/series/admin', { params: { page, limit } })
    return data
  },

  async createFilm(payload: Partial<Content>): Promise<Content> {
    const { data } = await api.post<Content>('/content/films', payload)
    return data
  },

  async createSerie(payload: Partial<Content>): Promise<Content> {
    const { data } = await api.post<Content>('/content/series', payload)
    return data
  },

  async updateFilm(id: string, payload: Partial<Content>): Promise<Content> {
    const { data } = await api.put<Content>(`/content/films/${id}`, payload)
    return data
  },

  async updateSerie(id: string, payload: Partial<Content>): Promise<Content> {
    const { data } = await api.put<Content>(`/content/series/${id}`, payload)
    return data
  },

  async publishFilm(id: string): Promise<Content> {
    const { data } = await api.patch<Content>(`/content/films/${id}/publish`)
    return data
  },

  async publishSerie(id: string): Promise<Content> {
    const { data } = await api.patch<Content>(`/content/series/${id}/publish`)
    return data
  },

  async deleteFilm(id: string): Promise<void> {
    await api.delete(`/content/films/${id}`)
  },

  async deleteSerie(id: string): Promise<void> {
    await api.delete(`/content/series/${id}`)
  },

  async getSeasons(serieId: string): Promise<Season[]> {
    const { data } = await api.get<Season[]>(`/content/series/${serieId}/seasons`)
    return data
  },

  async createSeason(serieId: string, payload: { number: number; title?: string; synopsis?: string; year?: number }): Promise<Season> {
    const { data } = await api.post<Season>(`/content/series/${serieId}/seasons`, payload)
    return data
  },

  async updateSeason(serieId: string, number: number, payload: { title?: string; synopsis?: string; year?: number; thumbnail_url?: string }): Promise<Season> {
    const { data } = await api.put<Season>(`/content/series/${serieId}/seasons/${number}`, payload)
    return data
  },

  async deleteSeason(serieId: string, number: number): Promise<void> {
    await api.delete(`/content/series/${serieId}/seasons/${number}`)
  },

  async getEpisodes(serieId: string, seasonNumber: number): Promise<Episode[]> {
    const { data } = await api.get<Episode[]>(`/content/series/${serieId}/seasons/${seasonNumber}/episodes`)
    return data
  },

  async createEpisode(serieId: string, seasonNumber: number, payload: {
    number: number
    title: string
    synopsis?: string
    is_free?: boolean
    thumbnail_url?: string
    video_url?: string
    duration_sec?: number
  }): Promise<Episode> {
    const { data } = await api.post<Episode>(
      `/content/series/${serieId}/seasons/${seasonNumber}/episodes`,
      payload
    )
    return data
  },

  async updateEpisode(episodeId: string, payload: Partial<Episode>): Promise<Episode> {
    const { data } = await api.put<Episode>(`/episodes/${episodeId}`, payload)
    return data
  },

  async deleteEpisode(episodeId: string): Promise<void> {
    await api.delete(`/episodes/${episodeId}`)
  },
}