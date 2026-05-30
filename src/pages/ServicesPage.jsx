import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking } from '../context/BookingContext'
import { fetchServices } from '../api/services'
import Spinner from '../components/layout/Spinner'

function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  )
}

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
  const { services, setServices, getNextRoute } = useBooking()
  const [allServices, setAllServices] = useState([])
  const [activeCategory, setActiveCategory] = useState('Все')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(services.map(s => s.id))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchServices()
      .then(data => { setAllServices(data); setLoading(false) })
      .catch(() => { setError('Не удалось загрузить услуги'); setLoading(false) })
  }, [])

  function retry() {
    setError(null)
    setLoading(true)
    fetchServices()
      .then(data => { setAllServices(data); setLoading(false) })
      .catch(() => { setError('Не удалось загрузить услуги'); setLoading(false) })
  }

  const categories = ['Все', ...new Set(allServices.map(s => s.category_name))]

  function toggleService(service) {
    const exists = selected.includes(service.id)
    const newSelected = exists
      ? selected.filter(id => id !== service.id)
      : [...selected, service.id]
    setSelected(newSelected)
    setServices(allServices.filter(s => newSelected.includes(s.id)))
  }

  const filtered = allServices.filter(s => {
    const matchCategory = activeCategory === 'Все' || s.category_name === activeCategory
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  const visibleCategories = [...new Set(filtered.map(s => s.category_name))]

  function formatDuration(minutes) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h && m) return `${h} ч ${m} мин`
    if (h) return `${h} ч`
    return `${m} мин`
  }

  const totalPrice = allServices.filter(s => selected.includes(s.id)).reduce((sum, s) => sum + s.price, 0)
  const totalDuration = allServices.filter(s => selected.includes(s.id)).reduce((sum, s) => sum + (s.duration || 0), 0)

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: '#1a1a1a' }}>

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
        <h2 className="text-white text-2xl font-bold tracking-tight">Услуги</h2>
        <p className="text-gray-500 text-sm mt-1">Можно выбрать несколько</p>
      </div>

      {loading && <Spinner text="Загружаем услуги..." />}

      {error && (
        <div className="flex flex-col items-center py-12 gap-4 px-6">
          <p className="text-red-400 text-center text-sm">{error}</p>
          <button
            onClick={retry}
            className="px-6 py-3 rounded-2xl text-white text-sm font-medium active:scale-95"
            style={{ backgroundColor: '#242424' }}
          >
            Попробовать снова
          </button>
        </div>
      )}

      {!loading && !error && (
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
                placeholder="Найти услугу"
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
                  {filtered.filter(s => s.category_name === cat).map((service, idx, arr) => {
                    const isSelected = selected.includes(service.id)
                    return (
                      <button
                        key={service.id}
                        onClick={() => toggleService(service)}
                        className="w-full flex items-center justify-between px-4 py-4 transition-all active:scale-95"
                        style={{
                          borderBottom: idx < arr.length - 1 ? '1px solid #2e2e2e' : 'none',
                          backgroundColor: isSelected ? '#2e2e2e' : 'transparent'
                        }}
                      >
                        <div className="text-left flex-1">
                          <div className="text-white text-sm font-medium">{service.name}</div>
                          <div className="text-gray-500 text-xs mt-0.5">
                            {formatDuration(service.duration)} · {service.price} L
                          </div>
                        </div>
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center ml-4 flex-shrink-0 transition-all"
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
      {selected.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4" style={{ backgroundColor: '#1a1a1a' }}>
          <button
            onClick={() => navigate(getNextRoute('services'))}
            className="w-full py-4 rounded-2xl font-semibold text-white transition-all active:scale-95"
            style={{ backgroundColor: '#f472b6' }}
          >
            <div className="text-sm font-semibold">Далее</div>
            <div className="text-xs opacity-75 mt-0.5">
              {selected.length} услуг · {totalDuration} мин · {totalPrice} L
            </div>
          </button>
        </div>
      )}
    </div>
  )
}