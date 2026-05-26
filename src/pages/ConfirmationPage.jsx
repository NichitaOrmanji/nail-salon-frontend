import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking } from '../context/BookingContext'

export default function ConfirmationPage() {
  const navigate = useNavigate()
  const { master, services, date, time, reset } = useBooking()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [sent, setSent] = useState(false)

  const totalPrice = services.reduce((sum, s) => sum + s.price, 0)
  const totalDuration = services.reduce((sum, s) => {
    const match = s.duration.match(/(\d+)\s*ч(?:\s*(\d+)\s*мин)?/)
    if (!match) return sum
    return sum + parseInt(match[1]) * 60 + parseInt(match[2] || 0)
  }, 0)

  function handleSubmit() {
    if (!name.trim() || !phone.trim()) return
    setSent(true)
    reset()
  }

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="text-6xl mb-6">✅</div>
        <h2 className="text-white text-2xl font-bold mb-2">Вы записаны!</h2>
        <p className="text-gray-400 text-center mb-8">Ждём вас в салоне. Мы отправим напоминание за день до визита.</p>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-4 rounded-2xl text-white font-semibold"
          style={{ backgroundColor: '#f472b6' }}
        >
          На главную
        </button>
      </div>
    )
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
        <h2 className="text-white text-2xl font-bold mb-6">Подтверждение записи</h2>

        <div className="rounded-2xl p-5 mb-6 space-y-3" style={{ backgroundColor: '#2a2a2a' }}>
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Специалист</span>
            <span className="text-white text-sm font-medium">
              {master?.name || '—'}
            </span>
          </div>
          <div className="border-t" style={{ borderColor: '#3a3a3a' }} />
          <div className="flex flex-col gap-1">
            <span className="text-gray-400 text-sm">Услуги</span>
            {services.map(s => (
              <div key={s.id} className="flex justify-between">
                <span className="text-white text-sm">{s.name}</span>
                <span className="text-white text-sm">{s.price} L</span>
              </div>
            ))}
          </div>
          <div className="border-t" style={{ borderColor: '#3a3a3a' }} />
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Дата и время</span>
            <span className="text-white text-sm font-medium">{date} в {time}</span>
          </div>
          <div className="border-t" style={{ borderColor: '#3a3a3a' }} />
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Длительность</span>
            <span className="text-white text-sm font-medium">
              {Math.floor(totalDuration / 60)} ч {totalDuration % 60 > 0 ? `${totalDuration % 60} мин` : ''}
            </span>
          </div>
          <div className="border-t" style={{ borderColor: '#3a3a3a' }} />
          <div className="flex justify-between">
            <span className="text-gray-400 text-sm">Итого</span>
            <span className="text-white text-sm font-bold">{totalPrice} L</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Ваше имя</label>
            <input
              type="text"
              placeholder="Введите имя"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl text-white placeholder-gray-500 outline-none"
              style={{ backgroundColor: '#2a2a2a' }}
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-2 block">Номер телефона</label>
            <input
              type="tel"
              placeholder="+373 __ ___ ____"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl text-white placeholder-gray-500 outline-none"
              style={{ backgroundColor: '#2a2a2a' }}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-2xl font-semibold text-white mt-6 transition-opacity"
          style={{
            backgroundColor: '#f472b6',
            opacity: name.trim() && phone.trim() ? 1 : 0.5
          }}
        >
          Записаться
        </button>
      </div>
    </div>
  )
}