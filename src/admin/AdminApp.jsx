import { Routes, Route, Navigate } from 'react-router-dom'
import { StaffAuthProvider } from './context/StaffAuthContext'
import RequireStaff from './components/RequireStaff'
import ManagerOnly from './components/ManagerOnly'
import AdminLayout from './layout/AdminLayout'
import LoginPage from './pages/LoginPage'
import JournalPage from './pages/JournalPage'
import ServicesPage from './pages/ServicesPage'
import MastersPage from './pages/MastersPage'
import SettingsPage from './pages/SettingsPage'

// Панель салона: /admin-panel/*
export default function AdminApp() {
  return (
    <StaffAuthProvider>
      <div className="min-h-dvh text-white" style={{ backgroundColor: '#111111' }}>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route element={<RequireStaff><AdminLayout /></RequireStaff>}>
            <Route index element={<JournalPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="masters" element={<MastersPage />} />
            <Route path="settings" element={<ManagerOnly><SettingsPage /></ManagerOnly>} />
          </Route>
          <Route path="*" element={<Navigate to="/admin-panel" replace />} />
        </Routes>
      </div>
    </StaffAuthProvider>
  )
}
