import { Navigate } from 'react-router-dom'
import { useStaffAuth } from '../context/StaffAuthContext'

// Страницы только для владельца и администратора (allowIndependent — и для мастера, который работает сам)
export default function ManagerOnly({ children, allowIndependent = false }) {
  const { isManager, isIndependent } = useStaffAuth()
  if (!isManager && !(allowIndependent && isIndependent)) return <Navigate to="/admin-panel" replace />
  return children
}
