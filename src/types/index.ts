export type UserRole = 'user' | 'artist' | 'admin'

export interface User {
  id: string
  email: string
  username: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  role: UserRole
  bio: string | null
  avatar_url: string | null
  phone: string | null
  is_verified: boolean
  is_active: boolean
  created_at: string
}

export type ContentStatus = 'draft' | 'published' | 'archived'
export type ContentType = 'film' | 'serie'

export interface Content {
  id: string
  type: ContentType
  title: string
  original_title: string | null
  year: number
  synopsis: string | null
  short_synopsis: string | null
  director: string | null
  cast: unknown
  language: string
  country: string | null
  rating: string | null
  thumbnail_url: string | null
  banner_url: string | null
  trailer_url: string | null
  is_premium: boolean
  price: number | null
  status: ContentStatus
  total_seasons: number
  view_count: number
  average_rating: number | null
  published_at: string | null
  created_at: string
}

export interface ContentListResponse {
  items: Content[]
  total: number
  page: number
  limit: number
}

export interface Episode {
  id: string
  season_id: string
  number: number
  title: string
  synopsis: string | null
  thumbnail_url: string | null
  video_url: string | null
  duration_sec: number | null
  is_free: boolean
  is_published: boolean
  view_count: number
  created_at: string
}

export interface Season {
  id: string
  content_id: string
  number: number
  title: string | null
  synopsis: string | null
  year: number | null
  thumbnail_url: string | null
  total_episodes: number
  created_at: string
}

export interface DashboardStats {
  users: number
  contents: number
  films: number
  series: number
  concerts: number
  events: number
  reels: number
  payments: number
  subscriptions: number
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

export interface PaginatedUsers {
  items?: User[]
  users?: User[]
}
