import { useState, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { isValidPhoneNumber } from 'libphonenumber-js'
import { useBooking, CONTACT_DRAFT_KEY } from '../context/BookingContext'
import { createAppointment } from '../api/appointments'
import { fetchMe } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { fetchSlotsByMaster } from '../api/slots'
import SalonHeader from '../components/layout/SalonHeader'
import PhoneField from '../components/layout/PhoneField'
import { formatDisplayDate, formatDuration, formatPrice } from '../utils/format'

function IconSuccess() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  )
}

// «Любой специалист»: берём первого мастера, свободного в выбранное время
async function resolveMasterId({ master, service, date, time }) {
  if (master?.id) return master.id
  const byTime = await fetchSlotsByMaster({ serviceId: service.id, date })
  const free = byTime[time]
  if (!free?.length) throw new Error('Это время уже занято. Выберите другое.')
  return free[0]
}

function loadDraft() {
  try {
    return JSON.parse(sessionStorage.getItem(CONTACT_DRAFT_KEY)) || {}
  } catch {
    return {}
  }
}

export default function ConfirmationPage() {
  const navigate = useNavigate()
  const { master, service, date, time, reset, getNextRoute } = useBooking()
  const { isLoggedIn } = useAuth()

  // Данные клиента запоминаем, чтобы не вводить их при каждой записи
  // Черновик формы (если клиент уходил на главную с сохранением) или данные прошлой записи
  const [draft] = useState(loadDraft)
  const [name, setName] = useState(() => draft.name ?? localStorage.getItem('client_name') ?? '')
  const [phone, setPhone] = useState(() => draft.phone ?? localStorage.getItem('client_phone') ?? '')
  const [email, setEmail] = useState(draft.email ?? '')
  const [notes, setNotes] = useState(draft.notes ?? '')
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [sent, setSent] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Сохраняем черновик, чтобы введённое не терялось при уходе на главную
  useEffect(() => {
    try {
      sessionStorage.setItem(CONTACT_DRAFT_KEY, JSON.stringify({ name, phone, email, notes }))
    } catch { /* недоступно */ }
  }, [name, phone, email, notes])

  // Залогиненному клиенту подставляем имя из профиля, если оно ещё не известно
  useEffect(() => {
    if (!isLoggedIn || localStorage.getItem('client_name')) return
    let cancelled = false
    fetchMe()
      .then(me => {
        const fullName = [me?.name, me?.surname].filter(Boolean).join(' ')
        if (cancelled || !fullName) return
        localStorage.setItem('client_name', fullName)
        setName(current => current || fullName)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [isLoggedIn])

  const phoneValid = phone && isValidPhoneNumber(phone)
  // Красным подсвечиваем после ухода из поля, чтобы не мешать, пока номер набирают
  const phoneInvalid = Boolean(phone) && !phoneValid && phoneTouched
  const canSubmit = name.trim() && phoneValid

  async function handleSubmit() {
    if (!canSubmit || submitting) return
    setSubmitError(null)
    setSubmitting(true)

    try {
      const masterId = await resolveMasterId({ master, service, date, time })
      // end_time бэкенд считает сам по длительности услуги
      await createAppointment({
        master: masterId,
        service: service.id,
        client_name: name.trim(),
        client_phone: phone,
        client_email: email.trim(),
        date,
        start_time: time,
        notes: notes.trim()
      })
      localStorage.setItem('client_name', name.trim())
      localStorage.setItem('client_phone', phone)
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
          Ждём вас в салоне. Запись появится в личном кабинете.
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

  // Открыли страницу напрямую или после обновления без выбора — отправляем на нужный шаг
  if (!service || master === null || !date || !time) {
    return <Navigate to={getNextRoute('confirm')} replace />
  }

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: '#1a1a1a' }}>

      <SalonHeader />

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
            <span className="text-white text-sm font-medium">{master.id ? master.name : 'Любой свободный'}</span>
          </div>

          <div className="flex justify-between items-center px-5 py-4" style={{ borderBottom: '1px solid #2e2e2e' }}>
            <span className="text-gray-500 text-sm">Услуга</span>
            <span className="text-white text-sm font-medium text-right">{service.name}</span>
          </div>

          <div className="flex justify-between items-center px-5 py-4" style={{ borderBottom: '1px solid #2e2e2e' }}>
            <span className="text-gray-500 text-sm">Дата и время</span>
            <span className="text-white text-sm font-medium">{formatDisplayDate(date)}, {time}</span>
          </div>

          <div className="flex justify-between items-center px-5 py-4" style={{ borderBottom: '1px solid #2e2e2e' }}>
            <span className="text-gray-500 text-sm">Длительность</span>
            <span className="text-white text-sm font-medium">{formatDuration(service.duration)}</span>
          </div>

          <div className="flex justify-between items-center px-5 py-4">
            <span className="text-gray-500 text-sm">Итого</span>
            <span className="text-white text-base font-bold">{formatPrice(service.price)}</span>
          </div>

        </div>

        {/* Форма */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-3">Ваши данные</p>
          {/* Без overflow-hidden: иначе обрезается список стран в PhoneField */}
          <div className="rounded-2xl relative" style={{ backgroundColor: '#242424' }}>

            <input
              type="text"
              placeholder="Имя"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-5 py-4 text-white placeholder-gray-600 outline-none text-sm rounded-t-2xl"
              style={{ backgroundColor: '#242424', borderBottom: '1px solid #2e2e2e' }}
            />
            <PhoneField
              value={phone}
              onChange={setPhone}
              onBlur={() => setPhoneTouched(true)}
              invalid={phoneInvalid}
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
              className="w-full px-5 py-4 text-white placeholder-gray-600 outline-none resize-none text-sm rounded-b-2xl"
              style={{ backgroundColor: '#242424' }}
            />

          </div>
          {phone && !phoneValid && (
            <p className="text-xs mt-2 px-1" style={{ color: phoneInvalid ? '#f87171' : '#6b7280' }}>
              Проверьте номер телефона
            </p>
          )}
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