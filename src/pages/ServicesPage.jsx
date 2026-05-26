import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking } from '../context/BookingContext'

const SERVICES = [
  { id: 1, category: 'Маникюр', name: 'Маникюр + гель / гель-лак (длина 1-3)', duration: '1 ч 30 мин', price: 520 },
  { id: 2, category: 'Маникюр', name: 'Маникюр + гель / гель-лак (длина 4-6)', duration: '1 ч 30 мин', price: 600 },
  { id: 3, category: 'Маникюр', name: 'Маникюр + гель / гель-лак (длина 7-8)', duration: '2 ч 30 мин', price: 750 },
  { id: 4, category: 'Педикюр', name: 'Педикюр классический', duration: '1 ч', price: 400 },
  { id: 5, category: 'Педикюр', name: 'Педикюр + гель-лак', duration: '1 ч 30 мин', price: 550 },
]

const CATEGORIES = ['Все', 'Маникюр', 'Педикюр']

export default function ServicesPage() {
  const navigate = useNavigate()
  const { services, setServices, getNextRoute } = useBooking()
  const [activeCategory, setActiveCategory] = useState('Все')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(services.map(s => s.id))

  function toggleService(service) {
    const exists = selected.includes(service.id)
    const newSelected = exists
      ? selected.filter(id => id !== service.id)
      : [...selected, service.id]
    setSelected(newSelected)
    setServices(SERVICES.filter(s => newSelected.includes(s.id)))
  }

  const categories = [...new Set(SERVICES.map(s => s.category))]

  const filtered = SERVICES.filter(s => {
    const matchCategory = activeCategory === 'Все' || s.category === activeCategory
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
    return matchCategory && matchSearch
  })

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
        <button onClick={() => navigate(-1)} className="text-white text-xl px-2">‹</button>
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm">💅</div>
        <div>
          <div className="text-white text-sm font-semibold">Название салона</div>
          <div className="text-gray-400 text-xs">ул. Пушкина, 1</div>
        </div>
      </div>

      <div className="px-6 py-6 pb-4">
        <h2 className="text-white text-2xl font-bold">Выбрать услуги</h2>
      </div>

      <div className="px-6 flex gap-2 mb-4">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              backgroundColor: activeCategory === cat ? '#f9a8d4' : '#2a2a2a',
              color: activeCategory === cat ? '#1a1a1a' : '#ffffff'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="px-6 mb-6">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ backgroundColor: '#2a2a2a' }}>
          <span className="text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Найти"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-white placeholder-gray-500 outline-none w-full text-sm"
          />
        </div>
      </div>

      <div className="px-6">
        {categories
          .filter(cat => activeCategory === 'Все' || cat === activeCategory)
          .map(cat => {
            const items = filtered.filter(s => s.category === cat)
            if (items.length === 0) return null
            return (
              <div key={cat} className="mb-6">
                <h3 className="text-white font-bold text-lg mb-3">{cat}</h3>
                <div className="space-y-1">
                  {items.map(service => (
                    <button
                      key={service.id}
                      onClick={() => toggleService(service)}
                      className="w-full flex items-center justify-between py-4 border-b"
                      style={{ borderColor: '#2a2a2a' }}
                    >
                      <div className="text-left">
                        <div className="text-white text-sm">{service.name}</div>
                        <div className="text-gray-400 text-xs mt-1">{service.duration}</div>
                        <div className="text-white text-sm font-medium mt-1">{service.price} L</div>
                      </div>
                      <div className="w-6 h-6 rounded border-2 flex items-center justify-center ml-4 flex-shrink-0"
                        style={{
                          borderColor: selected.includes(service.id) ? '#f472b6' : '#4b5563',
                          backgroundColor: selected.includes(service.id) ? '#f472b6' : 'transparent'
                        }}>
                        {selected.includes(service.id) && <span className="text-white text-xs">✓</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
      </div>

      {selected.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4" style={{ backgroundColor: '#1a1a1a' }}>
          <button
            onClick={() => navigate(getNextRoute('services'))}
            className="w-full py-4 rounded-2xl font-semibold text-white"
            style={{ backgroundColor: '#f472b6' }}
          >
            Далее — {selected.length} услуг выбрано
          </button>
        </div>
      )}
    </div>
  )
}