import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking } from '../context/BookingContext'
import { fetchMasters } from '../api/masters'
import { fetchSlotsByMaster } from '../api/slots'
import Spinner from '../components/layout/Spinner'
import SalonHeader from '../components/layout/SalonHeader'
import { t } from '../i18n'

function IconUser() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

// Фото мастера; если не загрузилось — значок вместо битой картинки
function MasterPhoto({ src, name }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return <IconUser />
  return <img src={src} className="w-full h-full object-cover" alt={name} onError={() => setFailed(true)} />
}

function Stars({ count }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= Math.round(count) ? '#f59e0b' : '#374151' }}>★</span>
      ))}
    </span>
  )
}

export default function MastersPage() {
  const navigate = useNavigate()
  const { master, setMaster, service, date, time, setDate, setTime, getNextRoute } = useBooking()
  const [masters, setMasters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(master ? (master.id ?? 'any') : null)

  // Время уже выбрано — показываем только мастеров, свободных в это время
  const filteredByTime = !!(service && date && time)

  async function loadMasters() {
    const data = await fetchMasters({ serviceId: service?.id })
    if (!filteredByTime) return data
    const byTime = await fetchSlotsByMaster({ serviceId: service.id, date })
    const free = byTime[time] || []
    return data.filter(m => free.includes(m.id))
  }

  function load() {
    return loadMasters()
      .then(data => { setMasters(data); setLoading(false) })
      .catch(err => { setError(err.message || t('Не удалось загрузить мастеров')); setLoading(false) })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSelect(m) {
    setSelected(m.id ?? 'any')
    setMaster(m)
    // Время подбиралось без учёта этого мастера — выбираем заново
    if (!filteredByTime && (date || time)) {
      setDate(null)
      setTime(null)
    }
    setTimeout(() => navigate(getNextRoute('masters')), 300)
  }

  function retry() {
    setError(null)
    setLoading(true)
    load()
  }

  const allMasters = masters.length === 0 ? [] : [
    { id: null, name: t('Любой специалист'), specialty: '' },
    ...masters.map(m => ({ ...m, specialty: m.description || t('Мастер маникюра и педикюра') }))
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a1a1a' }}>

      <SalonHeader />

      {/* Заголовок */}
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-white text-2xl font-bold tracking-tight">{t('Специалист')}</h2>
        <p className="text-gray-500 text-sm mt-1">
          {filteredByTime ? t('Свободны в {time}', { time }) : service ? t('Делают «{name}»', { name: service.name }) : t('Выберите мастера или пропустите')}
        </p>
      </div>

      {/* Состояния */}
      {loading && <Spinner text={t('Загружаем мастеров...')} />}

      {error && (
        <div className="flex flex-col items-center py-12 gap-4 px-6">
          <p className="text-red-400 text-center text-sm">{error}</p>
          <button
            onClick={retry}
            className="px-6 py-3 rounded-2xl text-white text-sm font-medium transition-all active:scale-95"
            style={{ backgroundColor: '#242424' }}
          >
            {t('Попробовать снова')}
          </button>
        </div>
      )}

      {!loading && !error && masters.length === 0 && (
        <div className="text-center py-12 px-6">
          <p className="text-white text-sm font-medium mb-1">{t('Нет свободных мастеров')}</p>
          <p className="text-gray-500 text-sm">{t('Попробуйте другое время или услугу')}</p>
        </div>
      )}

      {/* Список мастеров */}
      {!loading && !error && masters.length > 0 && (
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
                    <MasterPhoto src={m.photo} name={m.name} />
                  </div>

                  {/* Инфо */}
                  <div className="text-left">
                    <div className="text-white text-sm font-medium">{m.name}</div>
                    {m.specialty && (
                      <div className="text-gray-500 text-xs mt-0.5">{m.specialty}</div>
                    )}
                    {m.avg_rating && (
                      <div className="flex items-center gap-2 mt-1">
                        <Stars count={m.avg_rating} />
                        <span className="text-gray-500 text-xs">{m.avg_rating} · {t('отзывов: {count}', { count: m.reviews_count })}</span>
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