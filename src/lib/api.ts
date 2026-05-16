import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

const ADMIN_KEY = import.meta.env.VITE_ADMIN_SECRET_KEY ?? ''

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (ADMIN_KEY) config.headers['X-Admin-Key'] = ADMIN_KEY
  // Laisse le navigateur définir Content-Type + boundary pour les FormData
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const isRefreshCall = error.config?.url?.includes('/auth/refresh')
    if (error.response?.status === 401 && !isRefreshCall) {
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh', { refresh_token: refresh })
          localStorage.setItem('access_token', data.access_token)
          error.config.headers.Authorization = `Bearer ${data.access_token}`
          return api.request(error.config)
        } catch {
          localStorage.clear()
          window.location.href = '/admin/login'
        }
      } else {
        localStorage.clear()
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
