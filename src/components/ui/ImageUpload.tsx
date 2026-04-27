import { useRef, useState } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { uploadImage } from '@/services/upload.service'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  label?: string
  aspect?: 'poster' | 'banner' | 'square'
}

export function ImageUpload({ value, onChange, label, aspect = 'poster' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setLoading(true)
    try {
      const result = await uploadImage(file, 'content')
      onChange(result.url)
    } catch {
      setError("Échec de l'upload")
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const previewClass = aspect === 'poster'
    ? 'aspect-[2/3] max-h-40'
    : aspect === 'banner'
    ? 'aspect-video'
    : 'aspect-square max-h-40'

  return (
    <div className="space-y-2">
      {label && <label className="label">{label}</label>}

      {/* Zone de preview / drop */}
      <div
        className={`w-full ${previewClass} bg-gray-800 border border-gray-700 rounded-lg overflow-hidden relative flex items-center justify-center cursor-pointer group`}
        onClick={() => !loading && inputRef.current?.click()}
      >
        {value ? (
          <>
            <img src={value} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <Upload className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange('') }}
              className="absolute top-2 right-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-gray-400 transition-colors">
            <ImageIcon className="w-8 h-8" />
            <span className="text-xs">Cliquer pour choisir</span>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* URL manuelle */}
      <input
        className="input text-xs"
        placeholder="ou coller une URL d'image…"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}
