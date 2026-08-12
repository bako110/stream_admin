import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface DrawerProps {
  title: string
  onClose: () => void
  children: ReactNode
}

export function Drawer({ title, onClose, children }: DrawerProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel — plein écran sur mobile, 50% à partir de lg */}
      <div className="relative w-full lg:w-1/2 h-full bg-gray-900 border-l border-gray-800 flex flex-col shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-800 shrink-0">
          <h2 className="text-lg font-semibold text-white truncate">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors p-1 shrink-0 ml-3">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content — scroll vertical uniquement, pas d'overflow horizontal */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  )
}
