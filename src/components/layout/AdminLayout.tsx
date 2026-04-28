import { Outlet, useLocation } from 'react-router-dom'
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

  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-30 flex items-center px-6">
          <h1 className="text-lg font-semibold text-white">{title}</h1>
        </header>
        {/* Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
