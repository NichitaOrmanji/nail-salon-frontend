import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking } from '../context/BookingContext'

const MASTERS = [
  { id: null, name: 'Любой специалист', specialty: '', avatar: null },
  { id: 1, name: 'Марьяна', specialty: 'Мастер маникюра и педикюра', rating: 4, reviews: 1 },
  { id: 2, name: 'Анастасия Сочан', specialty: 'Мастер маникюра и педикюра', rating: 5, reviews: 11 },
  { id: 3, name: 'Аделина', specialty: 'Мастер маникюра и педикюра', rating: 5, reviews: 46 },
]

function Stars({ count }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= count ? '#f59e0b' : '#4b5563' }}>★</span>
      ))}
    </span>
  )
}

export default function MastersPage() {
  const navigate = useNavigate()
  const { master, setMaster, getNextRoute } = useBooking()
  const [selected, setSelected] = useState(master?.id ?? 'none')

  function handleSelect(m) {
    setSelected(m.id ?? 'none')
    setMaster(m)
    setTimeout(() => navigate(getNextRoute('masters')), 300)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
        <button onClick={() => navigate(-1)} className="text-white text-xl px-2">‹</button>
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm">💅</div>
        <div>
          <div className="text-white text-sm font-semibold">Название салона</div>
          <div className="text-gray-400 text-xs">ул. Пушкина, 1</div>
        </div>
      </div>

      <div className="px-6 py-6">
        <h2 className="text-white text-2xl font-bold">Выбрать специалиста</h2>
      </div>

      <div className="px-4 space-y-1">
        {MASTERS.map(m => (
          <button
            key={m.id ?? 'any'}
            onClick={() => handleSelect(m)}
            className="w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all"
            style={{ backgroundColor: selected === (m.id ?? 'none') ? '#2d2d2d' : 'transparent' }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: '#2a2a2a' }}>
                👤
              </div>
              <div className="text-left">
                <div className="text-white text-base">{m.name}</div>
                {m.specialty && <div className="text-gray-400 text-sm">{m.specialty}</div>}
                {m.rating && (
                  <div className="flex items-center gap-2 mt-1">
                    <Stars count={m.rating} />
                    <span className="text-gray-400 text-xs">{m.reviews} отзывов</span>
                  </div>
                )}
              </div>
            </div>
            <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0"
              style={{ borderColor: selected === (m.id ?? 'none') ? '#f472b6' : '#4b5563' }}>
              {selected === (m.id ?? 'none') && (
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f472b6' }} />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}