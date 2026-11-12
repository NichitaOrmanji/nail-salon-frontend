import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { isValidPhoneNumber } from 'libphonenumber-js'
import { useBooking, CONTACT_DRAFT_KEY } from '../context/BookingContext'
import { createAppointment, createVisit } from '../api/appointments'
import { fetchMe } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import { fetchSlotsByMaster } from '../api/slots'
import { fetchMasterServices } from '../api/masters'
import SalonHeader from '../components/layout/SalonHeader'
import { useCompany } from '../context/CompanyContext'
import PhoneField from '../components/layout/PhoneField'
import { formatDisplayDate, formatDuration, formatDurationRange, formatPrice, formatPriceRange } from '../utils/format'
import { getLang, t } from '../i18n'
import { downloadIcs } from '../utils/ics'

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
  if (!free?.length) throw new Error(t('Это время уже занято. Выберите другое.'))
  return free[0]
}

// Напоминание о визите: значение — минуты до визита ('' — как обычно, за сутки)
const REMINDERS = [
  ['', 'За сутки'],
  ['120', 'За 2 часа'],
  ['360', 'За 6 часов'],
  ['2880', 'За 2 дня'],
  ['0', 'Не напоминать'],
]

function loadDraft() {
  try {
    return JSON.parse(sessionStorage.getItem(CONTACT_DRAFT_KEY)) || {}
  } catch {
    return {}
  }
}

export default function ConfirmationPage() {
  const company = useCompany()
  const honeypotRef = useRef(null)
  const navigate = useNavigate()
  const { master, service, extras, visit, date, time, reset, getNextRoute } = useBooking()
  // Несколько услуг подряд: части визита выбраны на шаге времени
  const isVisit = extras.length > 0
  const { isLoggedIn } = useAuth()

  // Данные клиента запоминаем, чтобы не вводить их при каждой записи
  // Черновик формы (если клиент уходил на главную с сохранением) или данные прошлой записи
  const [draft] = useState(loadDraft)
  const [name, setName] = useState(() => draft.name ?? localStorage.getItem('client_name') ?? '')
  const [phone, setPhone] = useState(() => draft.phone ?? localStorage.getItem('client_phone') ?? '')
  const [email, setEmail] = useState(draft.email ?? '')
  const [notes, setNotes] = useState(draft.notes ?? '')
  const [reminder, setReminder] = useState(() => localStorage.getItem('client_reminder') ?? '')
  const [consent, setConsent] = useState(false)
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [sent, setSent] = useState(false)
  // Ссылка на бота для подтверждения записи (null — бот не настроен)
  const [telegramUrl, setTelegramUrl] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  // Цена и длительность у выбранного мастера (у мастера может быть своя); null — ещё не знаем
  const [ownTerms, setOwnTerms] = useState(null)
  useEffect(() => {
    if (!master?.id || !service?.id) return
    let cancelled = false
    fetchMasterServices(master.id)
      .then(list => {
        const own = list.find(s => s.id === service.id)
        if (!cancelled && own) setOwnTerms({ price: own.price, duration: own.duration })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [master?.id, service?.id])

  // Что записали (выбор сбрасывается после записи) и ссылка «Управлять записью»
  const [booked, setBooked] = useState(null)

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

  const visitMinutes = isVisit && visit ? visit.reduce((sum, part) => sum + part.duration, 0) : 0
  const visitPrice = isVisit && visit ? visit.reduce((sum, part) => sum + Number(part.price), 0) : 0

  const phoneValid = phone && isValidPhoneNumber(phone)
  // Красным подсвечиваем после ухода из поля, чтобы не мешать, пока номер набирают
  const phoneInvalid = Boolean(phone) && !phoneValid && phoneTouched
  const canSubmit = name.trim() && phoneValid && consent

  async function handleSubmit() {
    if (!canSubmit || submitting) return
    setSubmitError(null)
    setSubmitting(true)

    try {
      const contact = {
        client_name: name.trim(),
        client_phone: phone,
        client_email: email.trim(),
        date,
        start_time: time,
        notes: notes.trim(),
        consent: true,
        reminder_minutes: reminder === '' ? null : Number(reminder),
        // Поле-ловушка: человек его не видит; заполнил — значит бот, сервер запись не примет
        website: honeypotRef.current?.value || '',
      }
      let created
      if (isVisit) {
        // Мастера частей подобраны на шаге времени — отправляем именно их
        created = await createVisit({
          ...contact,
          items: visit.map(part => ({ service: part.service, master: part.master })),
        })
      } else {
        const masterId = await resolveMasterId({ master, service, date, time })
        // end_time бэкенд считает сам по длительности услуги
        created = await createAppointment({ ...contact, master: masterId, service: service.id })
      }
      setTelegramUrl(created?.telegram_url || null)
      setConfirmed(created?.status === 'confirmed')
      setBooked(isVisit ? {
        token: created?.manage_token || null,
        service: visit.map(part => part.service_name).join(' + '),
        duration: visitMinutes, date, time,
        master: [...new Set(visit.map(part => part.master_name))].join(', '),
      } : {
        token: created?.manage_token || null,
        service: service.name, duration: ownTerms?.duration || service.duration, date, time,
        master: master?.id ? master.name : null,
      })
      localStorage.setItem('client_name', name.trim())
      localStorage.setItem('client_phone', phone)
      localStorage.setItem('client_reminder', reminder)
      setSent(true)
      reset()
    } catch (err) {
      setSubmitError(err.message || t('Не удалось создать запись. Попробуйте ещё раз.'))
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
        <h2 className="text-white text-2xl font-bold mb-2 tracking-tight">
          {confirmed ? t('Запись подтверждена') : t('Вы записаны')}
        </h2>
        <p className="text-gray-400 text-sm text-center mb-3 max-w-xs">
          {confirmed
            ? t('Ждём вас в салоне. Запись появится в личном кабинете.')
            : t('Салон подтвердит запись — при необходимости вам позвонят по указанному номеру.')}
        </p>
        {booked && (
          <p className="text-white text-sm text-center mb-4">
            {booked.service} · {t('{date} в {time}', { date: formatDisplayDate(booked.date, { withYear: false, lang: getLang() }), time: booked.time })}
          </p>
        )}
        <p className="text-gray-500 text-xs text-center mb-5 max-w-xs">
          {booked?.token
            ? t('Планы изменились — перенесите или отмените запись по кнопке ниже.')
            : t('Не можете прийти — отмените запись в личном кабинете или позвоните в салон.')}{' '}
          <Link to="/rules" className="underline" style={{ color: '#f472b6' }}>{t('Правила салона')}</Link>
        </p>
        {booked && (
          <div className="w-full max-w-xs grid grid-cols-2 gap-2 mb-3">
            {booked.token && (
              <button
                type="button"
                onClick={() => navigate(`/manage/${booked.token}`)}
                className="py-3 rounded-2xl text-sm font-medium active:scale-95"
                style={{ backgroundColor: '#242424', color: '#f9a8d4' }}
              >
                {t('Перенести или отменить')}
              </button>
            )}
            <button
              type="button"
              onClick={() => downloadIcs({
                title: `${booked.service} — ${company?.name || ''}`.trim(),
                date: booked.date, start: booked.time, duration: booked.duration,
                location: company?.address, description: booked.master ? t('Мастер: {name}', { name: booked.master }) : '',
              })}
              className={`py-3 rounded-2xl text-sm font-medium active:scale-95 ${booked.token ? '' : 'col-span-2'}`}
              style={{ backgroundColor: '#242424', color: '#d1d5db' }}
            >
              {t('В календарь')}
            </button>
          </div>
        )}
        {telegramUrl && (
          <>
            <p className="text-gray-500 text-xs text-center mb-3 max-w-xs">
              {t('Хотите напоминание за сутки и за час до визита? Подключите Telegram — это необязательно.')}
            </p>
            <a
              href={telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full max-w-xs py-4 rounded-2xl text-white font-semibold text-center transition-all active:scale-95 mb-3"
              style={{ backgroundColor: '#1479a8' }}
            >
              {t('Напоминания в Telegram')}
            </a>
          </>
        )}
        <button
          onClick={() => navigate('/services')}
          className="w-full max-w-xs py-4 rounded-2xl font-semibold transition-all active:scale-95 mb-3"
          style={telegramUrl ? { backgroundColor: '#242424', color: '#d1d5db' } : { backgroundColor: '#db2777', color: '#fff' }}
        >
          {t('Записаться ещё')}
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-full max-w-xs py-3 rounded-2xl text-sm font-medium text-gray-400 active:scale-95"
        >
          {t('На главную')}
        </button>
      </div>
    )
  }

  // Открыли страницу напрямую или после обновления без выбора — отправляем на нужный шаг
  if (!service || master === null || !date || !time) {
    return <Navigate to={getNextRoute('confirm')} replace />
  }
  if (isVisit && !visit?.length) {
    return <Navigate to="/slots" replace />
  }

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: '#1a1a1a' }}>

      <SalonHeader />

      <div className="px-6 py-6 space-y-6">

        {/* Заголовок */}
        <div>
          <h2 className="text-white text-2xl font-bold tracking-tight">{t('Подтверждение')}</h2>
          <p className="text-gray-500 text-sm mt-1">{t('Проверьте детали записи')}</p>
        </div>

        {/* Карточка итога */}
        {isVisit ? (
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#242424' }}>
            <div className="flex justify-between items-center px-5 py-4" style={{ borderBottom: '1px solid #2e2e2e' }}>
              <span className="text-gray-500 text-sm">{t('Дата и время')}</span>
              <span className="text-white text-sm font-medium">
                {formatDisplayDate(date, { lang: getLang() })}, {visit[0].start_time} – {visit[visit.length - 1].end_time}
              </span>
            </div>
            {visit.map(part => (
              <div key={`${part.service}-${part.start_time}`} className="flex justify-between gap-4 px-5 py-3" style={{ borderBottom: '1px solid #2e2e2e' }}>
                <div className="min-w-0">
                  <div className="text-white text-sm font-medium wrap-anywhere">{part.service_name}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{part.start_time} · {part.master_name} · {formatDuration(part.duration, getLang())}</div>
                </div>
                <span className="text-white text-sm whitespace-nowrap">{formatPrice(part.price)}</span>
              </div>
            ))}
            <div className="flex justify-between items-center px-5 py-4">
              <span className="text-gray-500 text-sm">{t('Итого')}</span>
              <span className="text-white text-base font-bold">{formatPrice(visitPrice)}</span>
            </div>
          </div>
        ) : (
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#242424' }}>

          <div className="flex justify-between items-center px-5 py-4" style={{ borderBottom: '1px solid #2e2e2e' }}>
            <span className="text-gray-500 text-sm">{t('Специалист')}</span>
            <span className="text-white text-sm font-medium">{master.id ? master.name : t('Любой свободный')}</span>
          </div>

          <div className="flex justify-between items-center px-5 py-4" style={{ borderBottom: '1px solid #2e2e2e' }}>
            <span className="text-gray-500 text-sm">{t('Услуга')}</span>
            <span className="text-white text-sm font-medium text-right wrap-anywhere">{service.name}</span>
          </div>

          <div className="flex justify-between items-center px-5 py-4" style={{ borderBottom: '1px solid #2e2e2e' }}>
            <span className="text-gray-500 text-sm">{t('Дата и время')}</span>
            <span className="text-white text-sm font-medium">{formatDisplayDate(date, { lang: getLang() })}, {time}</span>
          </div>

          <div className="flex justify-between items-center px-5 py-4" style={{ borderBottom: '1px solid #2e2e2e' }}>
            <span className="text-gray-500 text-sm">{t('Длительность')}</span>
            <span className="text-white text-sm font-medium">{ownTerms ? formatDuration(ownTerms.duration, getLang()) : formatDurationRange(service, getLang())}</span>
          </div>

          <div className="flex justify-between items-center px-5 py-4">
            <span className="text-gray-500 text-sm">{t('Итого')}</span>
            <span className="text-white text-base font-bold">{ownTerms ? formatPrice(ownTerms.price) : formatPriceRange(service)}</span>
          </div>

        </div>
        )}

        {/* Форма */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-3">{t('Ваши данные')}</p>
          {/* Без overflow-hidden: иначе обрезается список стран в PhoneField */}
          <div className="rounded-2xl relative" style={{ backgroundColor: '#242424' }}>

            <input
              type="text"
              placeholder={t('Имя')}
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
              placeholder={t('Email (необязательно)')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-5 py-4 text-white placeholder-gray-600 outline-none text-sm"
              style={{ backgroundColor: '#242424', borderBottom: '1px solid #2e2e2e' }}
            />
            <textarea
              placeholder={t('Комментарий (необязательно)')}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full px-5 py-4 text-white placeholder-gray-600 outline-none resize-none text-sm rounded-b-2xl"
              style={{ backgroundColor: '#242424' }}
            />

          </div>
          <p className="text-gray-500 text-xs mt-2 px-1">
            {t('Укажите email — пришлём подтверждение со ссылкой для переноса и напоминание.')}
          </p>

          <div className="mt-4">
            <p id="reminder-label" className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-2">{t('Напоминание')}</p>
            <div role="radiogroup" aria-labelledby="reminder-label" className="flex flex-wrap gap-2">
              {REMINDERS.map(([value, label]) => (
                <button
                  key={value || 'default'}
                  type="button"
                  role="radio"
                  aria-checked={reminder === value}
                  onClick={() => setReminder(value)}
                  className="px-3 py-2 rounded-xl text-sm active:scale-95"
                  style={{ backgroundColor: reminder === value ? '#db2777' : '#242424', color: reminder === value ? '#fff' : '#d1d5db' }}
                >
                  {t(label)}
                </button>
              ))}
            </div>
            <p className="text-gray-500 text-xs mt-2 px-1">{t('Напомним в Telegram, если подключите его, или на email.')}</p>
          </div>
          {phone && !phoneValid && (
            <p className="text-xs mt-2 px-1" style={{ color: phoneInvalid ? '#f87171' : '#9098a4' }}>
              {t('Проверьте номер телефона')}
            </p>
          )}
        </div>

        {/* Правило салона (чёрный список) — клиент знает о штрафе до записи */}
        {Number(company.penalty_percent) > 0 && (
          <p className="text-gray-500 text-xs leading-relaxed">
            {Number(company.late_cancel_hours) > 0
              ? t('Если вы не придёте или отмените запись меньше чем за {hours} ч до визита, при следующем визите нужно будет оплатить штраф {percent}% стоимости пропущенной услуги. Оплата — на месте в салоне.',
                { hours: company.late_cancel_hours, percent: company.penalty_percent })
              : t('Если вы не придёте на запись, при следующем визите нужно будет оплатить штраф {percent}% стоимости пропущенной услуги. Оплата — на месте в салоне.',
                { percent: company.penalty_percent })}{' '}
            <Link to="/rules" className="underline" style={{ color: '#f472b6' }}>{t('Правила салона')}</Link>
          </p>
        )}

        {/* Ловушка для ботов: скрыто от людей и от экранных дикторов */}
        <input ref={honeypotRef} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
          className="absolute -left-[9999px] w-px h-px opacity-0" defaultValue="" />

        {/* Согласие на обработку персональных данных (Закон РМ № 133/2011) */}
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={consent}
            onChange={e => setConsent(e.target.checked)}
            className="mt-0.5 w-5 h-5 flex-shrink-0 accent-pink-400"
          />
          <span className="text-gray-400 text-xs leading-relaxed">
            {t('Согласен(на) на обработку моих персональных данных для записи и напоминаний —')}{' '}
            <Link to="/privacy" className="underline" style={{ color: '#f472b6' }}>{t('политика конфиденциальности')}</Link>
          </span>
        </label>

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
            backgroundColor: '#db2777',
            opacity: canSubmit && !submitting ? 1 : 0.4
          }}
        >
          {submitting ? t('Отправляем...') : t('Записаться')}
        </button>

      </div>
    </div>
  )
}