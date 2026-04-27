import { useRef, useState } from 'react'
import { Upload, X, Video } from 'lucide-react'
import { uploadVideo } from '@/services/upload.service'

interface VideoUploadProps {
  value: string
  onChange: (url: string, thumbnailUrl?: string, durationSec?: number) => void
  label?: string
}

export function VideoUpload({ value, onChange, label }: VideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setLoading(true)
    setProgress(0)
    try {
      const result = await uploadVideo(file, 'content', setProgress)
      onChange(
        result.url,
        result.thumbnail_url,
        result.duration ? Math.round(result.duration) : undefined,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de l\'upload vidéo')
    } finally {
      setLoading(false)
      setProgress(0)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const filename = value ? value.split('/').pop() : ''

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="border border-gray-700 rounded-lg bg-gray-800 p-3 space-y-2">
        {value ? (
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-violet-400 shrink-0" />
            <p className="text-xs text-gray-300 truncate flex-1">{filename}</p>
            <button
              type="button"
              onClick={() => onChange('')}
              className="text-gray-500 hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-500">
            <Video className="w-4 h-4" />
            <p className="text-xs">Aucune vidéo sélectionnée</p>
          </div>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="btn-ghost text-xs py-1.5 w-full justify-center"
        >
          <Upload className="w-3.5 h-3.5" />
          {loading ? `Upload… ${progress}%` : 'Choisir une vidéo (MP4)'}
        </button>

        {loading && (
          <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-violet-500 h-1.5 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <input
          className="input text-xs"
          placeholder="ou coller une URL vidéo…"
          value={value}
          onChange={e => onChange(e.target.value)}
        />

        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
      <input ref={inputRef} type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={handleFile} />
    </div>
  )
}
