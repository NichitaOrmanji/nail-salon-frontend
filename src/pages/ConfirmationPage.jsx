import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking } from '../context/BookingContext'
import { createAppointment } from '../api/appointments'

const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']

function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  )
}

function IconSuccess() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  )
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  return `${day} ${MONTHS[month - 1]} ${year}`
}

function formatDuration(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h && m) return `${h} ч ${m} мин`
  if (h) return `${h} ч`
  return `${m} мин`
}

export default function ConfirmationPage() {
  const navigate = useNavigate()
  const { master, services, date, time, reset } = useBooking()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [sent, setSent] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const totalPrice = services.reduce((sum, s) => sum + s.price, 0)
  const totalDuration = services.reduce((sum, s) => sum + (s.duration || 0), 0)
  const canSubmit = name.trim() && phone.trim()

  async function handleSubmit() {
    if (!canSubmit || submitting) return
    setSubmitError(null)
    setSubmitting(true)

    const duration = services.reduce((sum, s) => sum + (s.duration || 0), 0)
    const [hours, minutes] = time.split(':').map(Number)
    const end = new Date()
    end.setHours(hours)
    end.setMinutes(minutes + duration)
    const endTime = end.toTimeString().slice(0, 5)

    const payload = {
      master: master?.id || null,
      service: services[0]?.id || null,
      client_name: name,
      client_phone: phone,
      client_email: email,
      date: date,
      start_time: time,
      end_time: endTime,
      notes: notes
    }

    try {
      await createAppointment(payload)
      setSent(true)
      reset()
    } catch (err) {
      setSubmitError(err.message || 'Не удалось создать запись. Попробуйте ещё раз.')
    } finally {
      setSubmitting(false)
    }
  }

  // Экран успеха
  if (sent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="mb-6" style={{ color: '#f472b6' }}>
          <IconSuccess />
        </div>
        <h2 className="text-white text-2xl font-bold mb-2 tracking-tight">Вы записаны</h2>
        <p className="text-gray-500 text-sm text-center mb-10">
          Ждём вас в салоне. Напомним за день до визита.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-10 py-4 rounded-2xl text-white font-semibold transition-all active:scale-95"
          style={{ backgroundColor: '#f472b6' }}
        >
          На главную
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: '#1a1a1a' }}>

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

      <div className="px-6 py-6 space-y-6">

        {/* Заголовок */}
        <div>
          <h2 className="text-white text-2xl font-bold tracking-tight">Подтверждение</h2>
          <p className="text-gray-500 text-sm mt-1">Проверьте детали записи</p>
        </div>

        {/* Карточка итога */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#242424' }}>

          <div className="flex justify-between items-center px-5 py-4" style={{ borderBottom: '1px solid #2e2e2e' }}>
            <span className="text-gray-500 text-sm">Специалист</span>
            <span className="text-white text-sm font-medium">{master?.name || 'Любой'}</span>
          </div>

          <div className="px-5 py-4" style={{ borderBottom: '1px solid #2e2e2e' }}>
            <span className="text-gray-500 text-sm block mb-2">Услуги</span>
            <div className="space-y-1.5">
              {services.map(s => (
                <div key={s.id} className="flex justify-between">
                  <span className="text-white text-sm">{s.name}</span>
                  <span className="text-gray-400 text-sm">{s.price} L</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center px-5 py-4" style={{ borderBottom: '1px solid #2e2e2e' }}>
            <span className="text-gray-500 text-sm">Дата и время</span>
            <span className="text-white text-sm font-medium">{formatDisplayDate(date)}, {time}</span>
          </div>

          <div className="flex justify-between items-center px-5 py-4" style={{ borderBottom: '1px solid #2e2e2e' }}>
            <span className="text-gray-500 text-sm">Длительность</span>
            <span className="text-white text-sm font-medium">{formatDuration(totalDuration)}</span>
          </div>

          <div className="flex justify-between items-center px-5 py-4">
            <span className="text-gray-500 text-sm">Итого</span>
            <span className="text-white text-base font-bold">{totalPrice} L</span>
          </div>

        </div>

        {/* Форма */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-3">Ваши данные</p>
          <div className="rounded-2xl overflow-hidden space-y-px" style={{ backgroundColor: '#242424' }}>

            <input
              type="text"
              placeholder="Имя"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-5 py-4 text-white placeholder-gray-600 outline-none text-sm"
              style={{ backgroundColor: '#242424', borderBottom: '1px solid #2e2e2e' }}
            />
            <input
              type="tel"
              placeholder="+373 ___ __ ___"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-5 py-4 text-white placeholder-gray-600 outline-none text-sm"
              style={{ backgroundColor: '#242424', borderBottom: '1px solid #2e2e2e' }}
            />
            <input
              type="email"
              placeholder="Email (необязательно)"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-5 py-4 text-white placeholder-gray-600 outline-none text-sm"
              style={{ backgroundColor: '#242424', borderBottom: '1px solid #2e2e2e' }}
            />
            <textarea
              placeholder="Комментарий (необязательно)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full px-5 py-4 text-white placeholder-gray-600 outline-none resize-none text-sm"
              style={{ backgroundColor: '#242424' }}
            />

          </div>
        </div>

        {/* Ошибка отправки */}
        {submitError && (
          <p className="text-red-400 text-sm text-center">{submitError}</p>
        )}

        {/* Кнопка */}
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          className="w-full py-4 rounded-2xl font-semibold text-white transition-all active:scale-95"
          style={{
            backgroundColor: '#f472b6',
            opacity: canSubmit && !submitting ? 1 : 0.4
          }}
        >
          {submitting ? 'Отправляем...' : 'Записаться'}
        </button>

      </div>
    </div>
  )
}