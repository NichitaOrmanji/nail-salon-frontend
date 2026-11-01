import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BookingProvider } from './context/BookingContext'
import { AuthProvider } from './context/AuthContext'
import { CompanyProvider } from './context/CompanyContext'
import HomePage from './pages/HomePage'
import { PAGE_WIDTH } from './components/layout/width'
import ErrorBoundary from './components/layout/ErrorBoundary'
import Spinner from './components/layout/Spinner'
import { useLang } from './i18n'

// Страницу грузим, когда она нужна. После выкладки новой версии старые файлы исчезают —
// открытая вкладка один раз перезагружается и получает новые (иначе — экран ошибки)
function lazyPage(load) {
  return lazy(() => load().catch(error => {
    try {
      if (!sessionStorage.getItem('chunk-reload')) {
        sessionStorage.setItem('chunk-reload', '1')
        window.location.reload()
        return new Promise(() => {})
      }
    } catch { /* хранилище недоступно — показываем ошибку */ }
    throw error
  }))
}

// Главная — сразу; шаги записи — отдельными файлами, подгружаются заранее (см. ниже)
const loadBooking = [
  () => import('./pages/ServicesPage'),
  () => import('./pages/MastersPage'),
  () => import('./pages/SlotsPage'),
  () => import('./pages/ConfirmationPage'),
]
const ServicesPage = lazyPage(loadBooking[0])
const MastersPage = lazyPage(loadBooking[1])
const SlotsPage = lazyPage(loadBooking[2])
const ConfirmationPage = lazyPage(loadBooking[3])
const ProfilePage = lazyPage(() => import('./pages/ProfilePage'))
const AccountPage = lazyPage(() => import('./pages/AccountPage'))
const PrivacyPage = lazyPage(() => import('./pages/PrivacyPage'))
const RulesPage = lazyPage(() => import('./pages/RulesPage'))
const NotFoundPage = lazyPage(() => import('./pages/NotFoundPage'))

// Панель салона грузится отдельным чанком, чтобы клиентский бандл не рос
const AdminApp = lazyPage(() => import('./admin/AdminApp'))

// Пока клиент смотрит главную, браузер в простое докачивает шаги записи —
// переход к выбору услуги без ожидания
function usePrefetchBooking() {
  useEffect(() => {
    try { sessionStorage.removeItem('chunk-reload') } catch { /* недоступно */ }
    const prefetch = () => loadBooking.forEach(load => load().catch(() => {}))
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(prefetch, { timeout: 3000 })
      return () => window.cancelIdleCallback(id)
    }
    const timer = setTimeout(prefetch, 1500)
    return () => clearTimeout(timer)
  }, [])
}

const pageFallback = (
  <div className="min-h-screen flex items-center justify-center">
    <Spinner />
  </div>
)

// Клиентская часть: мобильная обёртка и провайдеры записи
function ClientApp() {
  // Смена языка перерисовывает страницы заново (тексты берутся при отрисовке);
  // выбранная запись хранится в провайдерах выше и не теряется
  const lang = useLang()
  usePrefetchBooking()
  return (
    <AuthProvider>
      <CompanyProvider>
        <BookingProvider>
          <div style={{ backgroundColor: '#111111' }} className="min-h-screen">
            <div className={`mx-auto w-full ${PAGE_WIDTH} min-h-screen relative`} style={{ backgroundColor: '#1a1a1a' }}>
              <ErrorBoundary key={lang}>
                <Suspense fallback={pageFallback}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/masters" element={<MastersPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/slots" element={<SlotsPage />} />
                  <Route path="/confirm" element={<ConfirmationPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/rules" element={<RulesPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
                </Suspense>
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
