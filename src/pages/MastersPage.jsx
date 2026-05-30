import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking } from '../context/BookingContext'
import { fetchMasters } from '../api/masters'
import Spinner from '../components/layout/Spinner'

function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  )
}

function IconUser() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function Stars({ count }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= count ? '#f59e0b' : '#374151' }}>★</span>
      ))}
    </span>
  )
}

export default function MastersPage() {
  const navigate = useNavigate()
  const { master, setMaster, getNextRoute } = useBooking()
  const [masters, setMasters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(master?.id ?? null)

  useEffect(() => {
    fetchMasters()
      .then(data => { setMasters(data); setLoading(false) })
      .catch(() => { setError('Не удалось загрузить мастеров'); setLoading(false) })
  }, [])

  function handleSelect(m) {
    setSelected(m.id ?? 'any')
    setMaster(m)
    setTimeout(() => navigate(getNextRoute('masters')), 300)
  }

  function retry() {
    setError(null)
    setLoading(true)
    fetchMasters()
      .then(data => { setMasters(data); setLoading(false) })
      .catch(() => { setError('Не удалось загрузить мастеров'); setLoading(false) })
  }

  const allMasters = [
    { id: null, name: 'Любой специалист', specialty: '' },
    ...masters.map(m => ({ ...m, specialty: m.description || 'Мастер маникюра и педикюра' }))
  ]

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
          <div className="text-white text-sm font-semibold">Название салона</div>
          <div className="text-gray-500 text-xs">ул. Пушкина, 1</div>
        </div>
      </div>

      {/* Заголовок */}
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-white text-2xl font-bold tracking-tight">Специалист</h2>
        <p className="text-gray-500 text-sm mt-1">Выберите мастера или пропустите</p>
      </div>

      {/* Состояния */}
      {loading && <Spinner text="Загружаем мастеров..." />}

      {error && (
        <div className="flex flex-col items-center py-12 gap-4 px-6">
          <p className="text-red-400 text-center text-sm">{error}</p>
          <button
            onClick={retry}
            className="px-6 py-3 rounded-2xl text-white text-sm font-medium transition-all active:scale-95"
            style={{ backgroundColor: '#242424' }}
          >
            Попробовать снова
          </button>
        </div>
      )}

      {/* Список мастеров */}
      {!loading && !error && (
        <div className="px-4 pb-8 space-y-1">
          {allMasters.map(m => {
            const isSelected = selected === (m.id ?? 'any')
            return (
              <button
                key={m.id ?? 'any'}
                onClick={() => handleSelect(m)}
                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all active:scale-95"
                style={{ backgroundColor: isSelected ? '#242424' : 'transparent' }}
              >
                <div className="flex items-center gap-4">
                  {/* Аватар */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: '#242424', color: '#6b7280' }}
                  >
                    {m.photo
                      ? <img src={m.photo} className="w-full h-full object-cover" alt={m.name} />
                      : <IconUser />
                    }
                  </div>

                  {/* Инфо */}
                  <div className="text-left">
                    <div className="text-white text-sm font-medium">{m.name}</div>
                    {m.specialty && (
                      <div className="text-gray-500 text-xs mt-0.5">{m.specialty}</div>
                    )}
                    {m.rating && (
                      <div className="flex items-center gap-2 mt-1">
                        <Stars count={m.rating} />
                        <span className="text-gray-500 text-xs">{m.reviews} отзывов</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Радио */}
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                  style={{ borderColor: isSelected ? '#f472b6' : '#374151' }}
                >
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#f472b6' }} />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}