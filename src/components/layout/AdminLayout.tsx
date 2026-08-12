import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/users': 'Gestion des utilisateurs',
  '/content/films': 'Films',
  '/content/series': 'Séries',
  '/content/episodes': 'Épisodes',
  '/managers': 'Managers',
  '/verification': 'Vérifications FoliX',
  '/reports': 'Signalements',
}

export function AdminLayout() {
  const { pathname } = useLocation()
  const title = PAGE_TITLES[pathname] ?? 'Administration'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0 lg:ml-60 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 -ml-1.5 text-gray-400 hover:text-gray-200 transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-white truncate">{title}</h1>
        </header>
        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
