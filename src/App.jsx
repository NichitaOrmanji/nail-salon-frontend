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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CompanyProvider>
          <BookingProvider>
            <div style={{ backgroundColor: '#111111' }} className="min-h-screen">
              <div className="mx-auto w-full max-w-md min-h-screen relative" style={{ backgroundColor: '#1a1a1a' }}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/masters" element={<MastersPage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/slots" element={<SlotsPage />} />
                  <Route path="/confirm" element={<ConfirmationPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </div>
            </div>
          </BookingProvider>
        </CompanyProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
