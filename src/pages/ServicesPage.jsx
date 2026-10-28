import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking } from '../context/BookingContext'
import { fetchServices } from '../api/services'
import Spinner from '../components/layout/Spinner'
import SalonHeader from '../components/layout/SalonHeader'
import { PAGE_WIDTH } from '../components/layout/width'
import { formatDuration, formatPrice } from '../utils/format'
import { getLang, t } from '../i18n'

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

export default function ServicesPage() {
  const navigate = useNavigate()
  const { master, service, setService, date, time, setDate, setTime, getNextRoute } = useBooking()
  const [allServices, setAllServices] = useState([])
  const [activeCategory, setActiveCategory] = useState(t('Все'))
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Если мастер уже выбран — показываем только его услуги,
  // если сначала выбрали время — только услуги, на которые есть свободный мастер
  const masterId = master?.id
  const filteredByTime = !masterId && date && time

  function load() {
    return fetchServices({ masterId, date, time })
      // Услуга без категории (категорию удалили в панели салона) — в отдельной группе
      .then(data => {
        setAllServices(data.map(s => ({ ...s, category_name: s.category_name || t('Без категории') })))
        setLoading(false)
      })
      .catch(err => { setError(err.message || t('Не удалось загрузить услуги')); setLoading(false) })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function retry() {
    setError(null)
    setLoading(true)
    load()
  }

  const categories = [t('Все'), ...new Set(allServices.map(s => s.category_name))]

  // Бэкенд хранит одну услугу на запись, поэтому выбор одиночный
  function selectService(s) {
    if (service?.id === s.id) {
      setService(null)
      return
    }
    setService(s)
    // Время подбиралось под другую услугу — его нужно выбрать заново
    if (service && !filteredByTime) {
      setDate(null)
      setTime(null)
    }
  }

  const filtered = allServices.filter(s => {
    const matchCategory = activeCategory === t('Все') || s.category_name === activeCategory
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  const visibleCategories = [...new Set(filtered.map(s => s.category_name))]

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: '#1a1a1a' }}>

      <SalonHeader />

      {/* Заголовок */}
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-white text-2xl font-bold tracking-tight">{t('Услуги')}</h2>
        <p className="text-gray-500 text-sm mt-1">
          {masterId ? t('Услуги мастера {name}', { name: master.name }) : filteredByTime ? t('Доступные в выбранное время') : t('Выберите услугу')}
        </p>
      </div>

      {loading && <Spinner text={t('Загружаем услуги...')} />}

      {error && (
        <div className="flex flex-col items-center py-12 gap-4 px-6">
          <p className="text-red-400 text-center text-sm">{error}</p>
          <button
            onClick={retry}
            className="px-6 py-3 rounded-2xl text-white text-sm font-medium active:scale-95"
            style={{ backgroundColor: '#242424' }}
          >
            {t('Попробовать снова')}
          </button>
        </div>
      )}

      {!loading && !error && allServices.length === 0 && (
        <div className="text-center py-12 px-6">
          <p className="text-white text-sm font-medium mb-1">{t('Нет доступных услуг')}</p>
          <p className="text-gray-500 text-sm">{t('Попробуйте выбрать другое время или мастера')}</p>
        </div>
      )}

      {!loading && !error && allServices.length > 0 && (
        <>
          {/* Фильтр категорий */}
          <div className="px-6 flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap active:scale-95"
                style={{
                  backgroundColor: activeCategory === cat ? '#f472b6' : '#242424',
                  color: activeCategory === cat ? '#ffffff' : '#9ca3af'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Поиск */}
          <div className="px-6 mb-6">
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ backgroundColor: '#242424' }}>
              <span className="text-gray-500"><IconSearch /></span>
              <input
                type="text"
                placeholder={t('Найти услугу')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent text-white placeholder-gray-600 outline-none w-full text-sm"
              />
            </div>
          </div>

          {/* Список услуг */}
          <div className="px-6">
            {visibleCategories.map(cat => (
              <div key={cat} className="mb-6">
                <h3 className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-3">{cat}</h3>
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#242424' }}>
                  {filtered.filter(s => s.category_name === cat).map((item, idx, arr) => {
                    const isSelected = service?.id === item.id
                    return (
                      <button
                        key={item.id}
                        onClick={() => selectService(item)}
                        className="w-full flex items-center justify-between px-4 py-4 transition-all active:scale-95"
                        style={{
                          borderBottom: idx < arr.length - 1 ? '1px solid #2e2e2e' : 'none',
                          backgroundColor: isSelected ? '#2e2e2e' : 'transparent'
                        }}
                      >
                        <div className="text-left flex-1">
                          <div className="text-white text-sm font-medium">{item.name}</div>
                          <div className="text-gray-500 text-xs mt-0.5">
                            {formatDuration(item.duration, getLang())} · {formatPrice(item.price)}
                          </div>
                        </div>
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center ml-4 flex-shrink-0 transition-all"
                          style={{
                            backgroundColor: isSelected ? '#f472b6' : 'transparent',
                            border: isSelected ? 'none' : '2px solid #374151'
                          }}
                        >
                          {isSelected && <IconCheck />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Кнопка далее */}
      {service && (
        <div className={`fixed bottom-0 left-0 right-0 mx-auto w-full ${PAGE_WIDTH} p-4`} style={{ backgroundColor: '#1a1a1a' }}>
          <button
            onClick={() => navigate(getNextRoute('services'))}
            className="w-full py-4 rounded-2xl font-semibold text-white transition-all active:scale-95"
            style={{ backgroundColor: '#f472b6' }}
          >
            <div className="text-sm font-semibold">{t('Далее')}</div>
            <div className="text-xs opacity-75 mt-0.5">
              {service.name} · {formatDuration(service.duration, getLang())} · {formatPrice(service.price)}
            </div>
          </button>
        </div>
      )}
    </div>
  )
}