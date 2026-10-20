import { Navigate } from 'react-router-dom'
import { useStaffAuth } from '../context/StaffAuthContext'

// Страницы только для владельца и администратора
export default function ManagerOnly({ children }) {
  const { isManager } = useStaffAuth()
  if (!isManager) return <Navigate to="/admin-panel" replace />
  return children
}
