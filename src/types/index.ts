export type UserRole = 'user' | 'artist' | 'admin'

export type ReportContentType = 'reel' | 'event' | 'concert' | 'comment'
export type ReportReason = 'spam' | 'inappropriate' | 'violence' | 'harassment' | 'misinformation' | 'other'
export type ReportStatus = 'pending' | 'resolved' | 'dismissed'

export interface Report {
  id: string
  content_type: ReportContentType
  content_id: string
  reason: ReportReason
  details: string | null
  status: ReportStatus
  created_at: string
  resolved_at: string | null
  reporter: { id: string; email: string; username: string | null }
  content_preview: {
    title: string
    thumbnail_url: string | null
    url: string | null
    is_blocked: boolean
    description: string | null
    created_at: string | null
  } | null
}

export interface ReportListResponse {
  items: Report[]
  total: number
  page: number
  limit: number
}

export interface UserReel {
  id: string
  caption: string | null
  video_url: string | null
  thumbnail_url: string | null
  views_count: number
  created_at: string | null
}

export interface UserEvent {
  id: string
  title: string
  status: string
  banner_url: string | null
  starts_at: string | null
  created_at: string | null
}

export interface UserConcert {
  id: string
  title: string
  status: string
  banner_url: string | null
  starts_at: string | null
  created_at: string | null
}

export interface UserComment {
  id: string
  body: string
  reel_id: string | null
  event_id: string | null
  concert_id: string | null
  created_at: string | null
}

export interface UserPost {
  id: string
  body: string | null
  image_url: string | null
  image_urls: string[] | null
  like_count: number
  comment_count: number
  created_at: string | null
}

export interface UserLive {
  id: string
  title: string
  status: string
  current_viewers: number
  peak_viewers: number
  started_at: string
  ended_at: string | null
}

export interface UserContent {
  reels: UserReel[]
  events: UserEvent[]
  concerts: UserConcert[]
  comments: UserComment[]
  posts: UserPost[]
  lives: UserLive[]
}
export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected'

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
  verification_status?: VerificationStatus
  verification_note?: string | null
  verification_requested_at?: string | null
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

export interface VideoMeta {
  id: string
  content_id: string | null
  episode_id: string | null
  label: string
  is_default: boolean
  is_free: boolean
  hls_url: string | null
  duration_sec: number | null
  transcode_status: string
  transcode_progress: number
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
