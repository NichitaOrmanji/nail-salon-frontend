import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCompany } from '../../context/CompanyContext'
import { useBooking } from '../../context/BookingContext'

function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  )
}

// Вопрос перед уходом на главную, если запись уже начата
function LeaveDialog({ onSave, onDiscard, onCancel }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-title"
        className="w-full max-w-sm rounded-3xl p-6"
        style={{ backgroundColor: '#1e1e1e', border: '1px solid #2e2e2e' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 id="leave-title" className="text-white text-lg font-bold mb-2">Перейти на главную?</h3>
        <p className="text-gray-400 text-sm mb-6">Сохранить выбранные данные записи, чтобы продолжить позже?</p>
        <div className="space-y-2">
          <button
            onClick={onSave}
            autoFocus
            className="w-full py-3.5 rounded-2xl text-white font-semibold transition-all active:scale-95"
            style={{ backgroundColor: '#f472b6' }}
          >
            Сохранить и выйти
          </button>
          <button
            onClick={onDiscard}
            className="w-full py-3.5 rounded-2xl font-medium transition-all active:scale-95"
            style={{ backgroundColor: '#2e2e2e', color: '#f87171' }}
          >
            Не сохранять
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-2xl text-gray-400 text-sm transition-all active:scale-95"
          >
            Остаться
          </button>
        </div>
      </div>
    </div>
  )
}

// Шапка шагов записи: кнопка «назад» + название и адрес салона (ведёт на главную)
export default function SalonHeader() {
  const navigate = useNavigate()
  const company = useCompany()
  const { hasProgress, reset } = useBooking()
  const [askLeave, setAskLeave] = useState(false)

  function goHome() {
    if (hasProgress) setAskLeave(true)
    else navigate('/')
  }

  return (
    <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: '#242424' }}>
      <button
        onClick={() => navigate(-1)}
        aria-label="Назад"
        className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 transition-all active:scale-90"
        style={{ backgroundColor: '#242424' }}
      >
        <IconBack />
      </button>
      <button onClick={goHome} className="flex-1 text-left active:opacity-70 transition-all" title="На главную">
        <div className="text-white text-sm font-semibold">{company.name}</div>
        <div className="text-gray-500 text-xs">{company.address}</div>
      </button>

      {askLeave && (
        <LeaveDialog
          onSave={() => { setAskLeave(false); navigate('/') }}
          onDiscard={() => { setAskLeave(false); reset(); navigate('/') }}
          onCancel={() => setAskLeave(false)}
        />
      )}
    </div>
  )
}
