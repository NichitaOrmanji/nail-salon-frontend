import { Routes, Route, Navigate } from 'react-router-dom'
import { StaffAuthProvider } from './context/StaffAuthContext'
import RequireStaff from './components/RequireStaff'
import ManagerOnly from './components/ManagerOnly'
import OwnerOnly from './components/OwnerOnly'
import AdminLayout from './layout/AdminLayout'
import LoginPage from './pages/LoginPage'
import JournalPage from './pages/JournalPage'
import ServicesPage from './pages/ServicesPage'
import MastersPage from './pages/MastersPage'
import SettingsPage from './pages/SettingsPage'
import FinancePage from './pages/FinancePage'
import MySalaryPage from './pages/MySalaryPage'
import ClientsPage from './pages/ClientsPage'
import HelpPage from './pages/HelpPage'

// Панель салона: /admin-panel/*
export default function AdminApp() {
  return (
    <StaffAuthProvider>
      <div className="min-h-dvh text-white" style={{ backgroundColor: '#111111' }}>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route element={<RequireStaff><AdminLayout /></RequireStaff>}>
            <Route index element={<JournalPage />} />
            <Route path="clients" element={<ManagerOnly><ClientsPage /></ManagerOnly>} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="masters" element={<MastersPage />} />
            <Route path="settings" element={<ManagerOnly><SettingsPage /></ManagerOnly>} />
            <Route path="finance" element={<OwnerOnly><FinancePage /></OwnerOnly>} />
            <Route path="salary" element={<MySalaryPage />} />
            <Route path="help" element={<HelpPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin-panel" replace />} />
        </Routes>
      </div>
    </StaffAuthProvider>
  )
}
