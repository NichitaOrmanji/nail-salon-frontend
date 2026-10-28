import { Navigate } from 'react-router-dom'
import { useStaffAuth } from '../context/StaffAuthContext'

// Страница только для владельца салона (финансы)
export default function OwnerOnly({ children }) {
  const { me } = useStaffAuth()
  if (me?.role !== 'owner') return <Navigate to="/admin-panel" replace />
  return children
}
