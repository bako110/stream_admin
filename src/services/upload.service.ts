import api from '@/lib/api'

export interface UploadResult {
  url: string
  public_id: string
  format?: string
}

export interface VideoUploadResult {
  url: string
  public_id: string
  duration?: number
  thumbnail_url?: string
}

export async function uploadImage(file: File, folder = 'content'): Promise<UploadResult> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post(`/upload/images?folder=${folder}`, form)
  return data.uploaded[0]
}

export async function uploadVideo(
  file: File,
  folder = 'content',
  onProgress?: (pct: number) => void,
): Promise<VideoUploadResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData()
    form.append('file', file)

    // Bypasse le proxy Vite pour les gros fichiers vidéo — le proxy Node.js
    // coupe les connexions sur les uploads > ~100 MB (ERR_CONNECTION_RESET)
    const directBase = import.meta.env.VITE_API_DIRECT_URL ?? ''
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${directBase}/api/v1/upload/video?folder=${folder}`)

    const token = localStorage.getItem('access_token')
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
      })
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as VideoUploadResult)
        } catch {
          reject(new Error('Réponse invalide du serveur'))
        }
      } else {
        let msg = `Erreur ${xhr.status}`
        try {
          const body = JSON.parse(xhr.responseText)
          if (body?.detail) msg = body.detail
        } catch { /* ignore */ }
        reject(new Error(msg))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Échec réseau')))
    xhr.addEventListener('abort', () => reject(new Error('Upload annulé')))

    xhr.send(form)
  })
}
