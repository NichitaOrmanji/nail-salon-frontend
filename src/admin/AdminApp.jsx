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
import DebtorsPage from './pages/DebtorsPage'
import SignupPage from './pages/SignupPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import TermsPage from './pages/TermsPage'
import StartPage from './pages/StartPage'

// Панель салона: /admin-panel/*
export default function AdminApp() {
  return (
    <StaffAuthProvider>
      <div className="min-h-dvh text-white" style={{ backgroundColor: '#111111' }}>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          {/* Без входа: регистрация салона, подтверждение email, восстановление пароля, условия */}
          <Route path="signup" element={<SignupPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route element={<RequireStaff><AdminLayout /></RequireStaff>}>
            <Route index element={<JournalPage />} />
            <Route path="start" element={<ManagerOnly><StartPage /></ManagerOnly>} />
            <Route path="clients" element={<ManagerOnly><ClientsPage /></ManagerOnly>} />
            <Route path="debtors" element={<ManagerOnly><DebtorsPage /></ManagerOnly>} />
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
