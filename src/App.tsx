import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Capacitor } from '@capacitor/core'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminOnlyRoute } from '@/components/AdminOnlyRoute'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { UsersPage } from '@/pages/UsersPage'
import { FilmsPage } from '@/pages/FilmsPage'
import { SeriesPage } from '@/pages/SeriesPage'
import { SeasonsPage } from '@/pages/SeasonsPage'
import { EpisodesPage } from '@/pages/EpisodesPage'
import { ManagersPage } from '@/pages/ManagersPage'
import { VerificationPage } from '@/pages/VerificationPage'
import { MonetizationPage } from '@/pages/MonetizationPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { FeedbackPage } from '@/pages/FeedbackPage'
import { CommunitiesPage } from '@/pages/CommunitiesPage'
import { FinancePage } from '@/pages/FinancePage'
import { SupportPage } from '@/pages/SupportPage'
import { NotificationsPage } from '@/pages/NotificationsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

// App native : servie à la racine (https://localhost/), pas sous /admin/
// comme en prod web (nginx). Sans ce basename conditionnel, aucune route ne
// matche jamais dans l'app installée — écran vide, sans erreur ni crash.
const basename = Capacitor.isNativePlatform() ? '/' : '/admin'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter basename={basename}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="content/films" element={<FilmsPage />} />
              <Route path="content/series" element={<SeriesPage />} />
              <Route path="content/seasons" element={<SeasonsPage />} />
              <Route path="content/episodes" element={<EpisodesPage />} />
              <Route path="managers" element={<AdminOnlyRoute><ManagersPage /></AdminOnlyRoute>} />
              <Route path="verification" element={<VerificationPage />} />
              <Route path="monetization" element={<MonetizationPage />} />
              <Route path="communities" element={<CommunitiesPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route path="finance" element={<AdminOnlyRoute><FinancePage /></AdminOnlyRoute>} />
              <Route path="support" element={<SupportPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
