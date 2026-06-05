import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchMyAppointments } from '../api/profile'
import Spinner from '../components/layout/Spinner'

function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  )
}

function IconLogout() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )
}

const STATUS_LABELS = {
  pending: { label: 'Ожидает', color: '#f59e0b' },
  confirmed: { label: 'Подтверждена', color: '#34d399' },
  cancelled: { label: 'Отменена', color: '#f87171' },
  completed: { label: 'Завершена', color: '#9ca3af' },
}

export default function AccountPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchMyAppointments()
      .then(data => { setAppointments(data); setLoading(false) })
      .catch(() => { setError('Не удалось загрузить записи'); setLoading(false) })
  }, [])

  function handleLogout() {
    logout()
    navigate('/')
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-').map(Number)
    const MONTHS = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
    return `${day} ${MONTHS[month - 1]} ${year}`
  }

  function formatTime(timeStr) {
    return timeStr?.slice(0, 5) || ''
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a1a1a' }}>

      {/* Шапка */}
      <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: '#242424' }}>
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 transition-all active:scale-90"
          style={{ backgroundColor: '#242424' }}
        >
          <IconBack />
        </button>
        <div className="flex-1">
          <div className="text-white text-sm font-semibold">Личный кабинет</div>
        </div>
        <button
          onClick={handleLogout}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 transition-all active:scale-90"
          style={{ backgroundColor: '#242424' }}
        >
          <IconLogout />
        </button>
      </div>

      <div className="px-6 py-6">

        {/* Заголовок */}
        <div className="mb-6">
          <h2 className="text-white text-2xl font-bold tracking-tight">Мои записи</h2>
          <p className="text-gray-500 text-sm mt-1">История ваших визитов</p>
        </div>

        {loading && <Spinner text="Загружаем записи..." />}

        {error && (
          <div className="flex flex-col items-center py-12 gap-4">
            <p className="text-red-400 text-center text-sm">{error}</p>
            <button
              onClick={() => {
                setError(null)
                setLoading(true)
                fetchMyAppointments()
                  .then(data => { setAppointments(data); setLoading(false) })
                  .catch(() => { setError('Не удалось загрузить записи'); setLoading(false) })
              }}
              className="px-6 py-3 rounded-2xl text-white text-sm font-medium active:scale-95"
              style={{ backgroundColor: '#242424' }}
            >
              Попробовать снова
            </button>
          </div>
        )}

        {!loading && !error && appointments.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-4">
            <p className="text-white text-sm font-medium">Записей пока нет</p>
            <p className="text-gray-500 text-sm">Запишитесь на первый визит</p>
            <button
              onClick={() => navigate('/')}
              className="mt-2 px-8 py-4 rounded-2xl text-white font-semibold active:scale-95"
              style={{ backgroundColor: '#f472b6' }}
            >
              Записаться
            </button>
          </div>
        )}

        {!loading && !error && appointments.length > 0 && (
          <div className="space-y-3">
            {appointments.map(a => {
              const status = STATUS_LABELS[a.status] || { label: a.status, color: '#9ca3af' }
              return (
                <div key={a.id} className="rounded-2xl p-5" style={{ backgroundColor: '#242424' }}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-white text-sm font-semibold">{a.service}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{a.master}</div>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-lg"
                      style={{ backgroundColor: '#2e2e2e', color: status.color }}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-xs">{formatDate(a.date)}</span>
                    <span className="text-gray-600 text-xs">·</span>
                    <span className="text-gray-400 text-xs">{formatTime(a.start_time)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}