import { Navigate, useLocation } from 'react-router-dom'
import { useStaffAuth } from '../context/StaffAuthContext'
import Spinner from '../../components/layout/Spinner'
import { Button } from './ui'

// Пускает дальше только вошедший персонал, иначе — на страницу входа
export default function RequireStaff({ children }) {
  const { me, loading, meError, refreshMe, logout } = useStaffAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#111111' }}>
        <Spinner />
      </div>
    )
  }

  // Токен есть, но сервер не ответил — даём повторить, а не выкидываем
  if (!me && meError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center" style={{ backgroundColor: '#111111' }}>
        <p className="text-red-400 text-sm">{meError}</p>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => refreshMe().catch(() => {})}>Повторить</Button>
          <Button onClick={logout}>Выйти</Button>
        </div>
      </div>
    )
  }

  if (!me) {
    return <Navigate to="/admin-panel/login" replace state={{ from: location.pathname + location.search }} />
  }

  return children
}
