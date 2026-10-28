import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BookingProvider } from './context/BookingContext'
import { AuthProvider } from './context/AuthContext'
import { CompanyProvider } from './context/CompanyContext'
import HomePage from './pages/HomePage'
import MastersPage from './pages/MastersPage'
import ServicesPage from './pages/ServicesPage'
import SlotsPage from './pages/SlotsPage'
import ConfirmationPage from './pages/ConfirmationPage'
import NotFoundPage from './pages/NotFoundPage'
import ProfilePage from './pages/ProfilePage'
import AccountPage from './pages/AccountPage'
import PrivacyPage from './pages/PrivacyPage'
import { PAGE_WIDTH } from './components/layout/width'
import ErrorBoundary from './components/layout/ErrorBoundary'
import Spinner from './components/layout/Spinner'

// Панель салона грузится отдельным чанком, чтобы клиентский бандл не рос
const AdminApp = lazy(() => import('./admin/AdminApp'))

// Клиентская часть: мобильная обёртка и провайдеры записи
function ClientApp() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <BookingProvider>
          <div style={{ backgroundColor: '#111111' }} className="min-h-screen">
            <div className={`mx-auto w-full ${PAGE_WIDTH} min-h-screen relative`} style={{ backgroundColor: '#1a1a1a' }}>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/masters" element={<MastersPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/slots" element={<SlotsPage />} />
                  <Route path="/confirm" element={<ConfirmationPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </ErrorBoundary>
            </div>
          </div>
        </BookingProvider>
      </CompanyProvider>
    </AuthProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Панель салона — вне мобильной обёртки и без клиентских провайдеров */}
        <Route
          path="/admin-panel/*"
          element={
            <ErrorBoundary homePath="/admin-panel" homeLabel="В панель салона">
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#111111' }}>
                    <Spinner />
                  </div>
                }
              >
                <AdminApp />
              </Suspense>
            </ErrorBoundary>
          }
        />
        <Route path="*" element={<ClientApp />} />
      </Routes>
    </BrowserRouter>
  )
}
