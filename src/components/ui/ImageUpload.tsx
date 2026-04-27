import { useRef, useState } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { uploadImage } from '@/services/upload.service'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  label?: string
  aspect?: 'poster' | 'banner' | 'square'
}

const ASPECT_CLASSES = {
  poster: 'aspect-[2/3] w-32',
  banner: 'aspect-video w-full',
  square: 'aspect-square w-32',
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
      setError('Échec de l\'upload')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div className="flex items-start gap-3">
        {/* Preview */}
        <div
          className={`${ASPECT_CLASSES[aspect]} bg-gray-800 border border-gray-700 rounded-lg overflow-hidden flex items-center justify-center shrink-0 relative`}
        >
          {value ? (
            <>
              <img src={value} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <ImageIcon className="w-6 h-6 text-gray-600" />
          )}
          {loading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Bouton + champ URL manuel */}
        <div className="flex-1 space-y-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="btn-ghost text-xs py-1.5 w-full justify-center"
          >
            <Upload className="w-3.5 h-3.5" />
            {loading ? 'Upload…' : 'Choisir un fichier'}
          </button>
          <input
            className="input text-xs"
            placeholder="ou coller une URL…"
            value={value}
            onChange={e => onChange(e.target.value)}
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}
