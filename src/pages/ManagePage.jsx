import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { cancelManaged, fetchManaged, fetchManagedSlots, rescheduleManaged } from '../api/manage'
import { fetchMonthLoad } from '../api/slots'
import LoadCalendar from '../components/LoadCalendar'
import SalonHeader from '../components/layout/SalonHeader'
import Spinner from '../components/layout/Spinner'
import { PAGE_WIDTH } from '../components/layout/width'
import { getLang, t } from '../i18n'
import { formatDisplayDate, formatDuration, toDateString } from '../utils/format'
import { downloadIcs } from '../utils/ics'
import { groupSlots } from '../utils/slotGroups'

const STATUS = {
  pending: { label: 'Ожидает подтверждения салона', color: '#fbbf24' },
  confirmed: { label: 'Подтверждена', color: '#34d399' },
  cancelled: { label: 'Отменена', color: '#f87171' },
  completed: { label: 'Визит состоялся', color: '#9ca3af' },
  no_show: { label: 'Пропущена', color: '#f87171' },
}

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-3" style={{ borderBottom: '1px solid #2a2a2a' }}>
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="text-white text-sm font-medium text-right wrap-anywhere">{children}</span>
    </div>
  )
}

// Страница «Управлять записью» по ссылке из сообщения или с экрана после записи: без входа
export default function ManagePage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [appointment, setAppointment] = useState(null)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  // Перенос: календарь мастера с кружками → свободное время
  const [moving, setMoving] = useState(false)
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [monthLoad, setMonthLoad] = useState({})
  const [day, setDay] = useState(null)
  const [slots, setSlots] = useState(null)
  const [slot, setSlot] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchManaged(token)
      .then(data => { if (!cancelled) setAppointment(data) })
      .catch(err => { if (!cancelled) setError(err.message || t('Запись не найдена')) })
    return () => { cancelled = true }
  }, [token])

  useEffect(() => {
    if (!moving || !appointment?.service || !appointment?.master) return
    let cancelled = false
    const key = `${year}-${String(month + 1).padStart(2, '0')}`
    fetchMonthLoad({ month: key, serviceId: appointment.service.id, masterId: appointment.master.id })
      .then(days => { if (!cancelled) setMonthLoad(days) })
      .catch(() => { if (!cancelled) setMonthLoad({}) })
    return () => { cancelled = true }
  }, [moving, year, month, appointment?.service, appointment?.master])

  async function pickDay(dateStr) {
    setDay(dateStr)
    setSlot(null)
    setSlots(null)
    setActionError(null)
    try {
      setSlots(await fetchManagedSlots(token, dateStr))
    } catch (err) {
      setSlots([])
      setActionError(err.message)
    }
  }

  async function confirmMove() {
    if (!day || !slot || busy) return
    setBusy(true)
    setActionError(null)
    try {
      setAppointment(await rescheduleManaged(token, { date: day, time: slot }))
      setMoving(false)
      setDay(null)
      setSlot(null)
      setNotice(t('Запись перенесена'))
    } catch (err) {
      setActionError(err.message || t('Не удалось перенести запись'))
      if (day) pickDay(day)
    } finally {
      setBusy(false)
    }
  }

  async function cancel() {
    const question = appointment.late_cancel_penalty
      ? t('До визита осталось мало времени: при отмене будет начислен штраф {amount} L, его нужно будет оплатить в салоне при следующем визите. Всё равно отменить?',
        { amount: Number(appointment.late_cancel_penalty) })
      : t('Отменить запись?')
    if (!window.confirm(question)) return
    setBusy(true)
    setActionError(null)
    try {
      setAppointment(await cancelManaged(token))
      setMoving(false)
      setNotice(t('Запись отменена'))
    } catch (err) {
      setActionError(err.message || t('Не удалось отменить запись'))
    } finally {
      setBusy(false)
    }
  }

  function addToCalendar() {
    const a = appointment
    downloadIcs({
      title: `${a.visit?.parts?.length > 1 ? a.visit.parts.map(p => p.service_name).join(' + ') : (a.service?.name || t('Визит'))} — ${a.salon.name}`,
      date: a.date, start: a.visit?.start_time || a.start_time, end: a.visit?.end_time || a.end_time,
      location: a.salon.address,
      description: a.master ? t('Мастер: {name}', { name: a.master.name }) : '',
    })
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#1a1a1a' }}>
        <SalonHeader />
        <div className="px-6 py-16 text-center">
          <p className="text-white text-base font-medium mb-2">{t('Запись не найдена')}</p>
          <p className="text-gray-500 text-sm mb-6">{t('Ссылка устарела или набрана с ошибкой. Позвоните в салон или запишитесь заново.')}</p>
          <button onClick={() => navigate('/')} className="px-6 py-3 rounded-2xl text-white text-sm font-medium" style={{ backgroundColor: 'var(--accent)' }}>
            {t('На главную')}
          </button>
        </div>
      </div>
    )
  }

  if (!appointment) {
    return <div className="min-h-screen" style={{ backgroundColor: '#1a1a1a' }}><SalonHeader /><Spinner /></div>
  }

  const status = STATUS[appointment.status] || STATUS.pending
  // Визит из нескольких услуг: отменяются и переносятся все части сразу
  const visit = appointment.visit?.parts?.length > 1 ? appointment.visit : null
  const lang = getLang()
  const active = appointment.status === 'pending' || appointment.status === 'confirmed'

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: '#1a1a1a' }}>
      <SalonHeader />

      <div className="px-6 pt-6 pb-4">
        <h2 className="text-white text-2xl font-bold tracking-tight">{t('Ваша запись')}</h2>
        <p className="text-sm mt-1 font-medium" style={{ color: status.color }}>{t(status.label)}</p>
      </div>

      {notice && (
        <div role="status" className="mx-6 mb-4 px-4 py-3 rounded-2xl text-sm" style={{ backgroundColor: 'rgba(52, 211, 153, 0.1)', color: '#6ee7b7' }}>
          {notice}
        </div>
      )}

      <div className="mx-6 px-4 rounded-2xl" style={{ backgroundColor: '#212121' }}>
        <Row label={t('Салон')}>{appointment.salon.name}</Row>
        {visit ? (
          <>
            <Row label={t('Дата и время')}>
              {formatDisplayDate(appointment.date, { withYear: false, lang })}, {visit.start_time} – {visit.end_time}
            </Row>
            {visit.parts.map(part => (
              <Row key={`${part.service}-${part.start_time}`} label={part.start_time}>
                {part.service_name} · {part.master_name}
              </Row>
            ))}
          </>
        ) : (
          <>
            {appointment.service && <Row label={t('Услуга')}>{appointment.service.name}</Row>}
            {appointment.master && <Row label={t('Специалист')}>{appointment.master.name}</Row>}
            <Row label={t('Дата и время')}>
              {t('{date} в {time}', { date: formatDisplayDate(appointment.date, { withYear: false, lang }), time: appointment.start_time })}
            </Row>
            {appointment.service && <Row label={t('Длительность')}>{formatDuration(appointment.service.duration)}</Row>}
          </>
        )}
        {appointment.salon.address && <Row label={t('Адрес')}>{appointment.salon.address}</Row>}
      </div>

      {actionError && <p role="alert" className="mx-6 mt-4 text-red-400 text-sm text-center">{actionError}</p>}

      {active && !moving && (
        <div className="mx-6 mt-6 space-y-2">
          {appointment.can_reschedule && (
            <button
              type="button"
              onClick={() => { setMoving(true); setNotice(null) }}
              className="w-full py-4 rounded-2xl text-white font-semibold active:scale-95"
              style={{ backgroundColor: 'var(--accent)' }}
            >
              {t('Перенести на другое время')}
            </button>
          )}
          <button
            type="button"
            onClick={addToCalendar}
            className="w-full py-4 rounded-2xl font-semibold active:scale-95"
            style={{ backgroundColor: '#242424', color: '#d1d5db' }}
          >
            {t('Добавить в календарь')}
          </button>
          {appointment.can_cancel ? (
            <button
              type="button"
              onClick={cancel}
              disabled={busy}
              className="w-full py-3 rounded-2xl text-sm font-medium active:scale-95"
              style={{ color: '#f87171' }}
            >
              {t('Отменить запись')}
            </button>
          ) : (
            <p className="text-gray-500 text-xs text-center pt-2">
              {t('Изменить запись онлайн уже нельзя.')}
              {appointment.salon.phone && <> {t('Позвоните в салон:')} <a href={`tel:${appointment.salon.phone}`} className="underline" style={{ color: 'var(--accent-ink)' }}>{appointment.salon.phone}</a></>}
            </p>
          )}
          {!appointment.can_reschedule && appointment.can_cancel && (
            <p className="text-gray-500 text-xs text-center">{t('Перенести онлайн уже нельзя — можно отменить или позвонить в салон.')}</p>
          )}
        </div>
      )}

      {active && moving && (
        <div className="px-6 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white text-lg font-semibold">{t('Новое время')}</h3>
            <button type="button" onClick={() => { setMoving(false); setDay(null); setSlot(null) }} className="text-gray-400 text-sm">
              {t('Отмена')}
            </button>
          </div>
          <LoadCalendar
            year={year}
            month={month}
            onMonthChange={(y, m) => { setYear(y); setMonth(m); setDay(null); setSlots(null); setSlot(null) }}
            days={monthLoad}
            selected={day}
            onSelect={pickDay}
            clientMode
            minMonth={toDateString(today).slice(0, 7)}
          />
          {day && slots === null && <Spinner text={t('Загружаем слоты...')} />}
          {day && slots?.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-6">{t('Нет свободного времени. Попробуйте другую дату')}</p>
          )}
          {day && slots?.length > 0 && (
            <div className="mt-6 space-y-4">
              {groupSlots(slots).map(group => (
                <div key={group.key}>
                  <p className="text-gray-600 text-xs mb-2">{t(group.label)}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {group.slots.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSlot(s)}
                        aria-pressed={slot === s}
                        className="py-3 rounded-xl text-sm font-medium active:scale-95"
                        style={{ backgroundColor: slot === s ? 'var(--accent)' : '#242424', color: slot === s ? '#fff' : '#9ca3af' }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {moving && slot && (
        <div className={`fixed bottom-0 left-0 right-0 mx-auto w-full ${PAGE_WIDTH} p-4`} style={{ backgroundColor: '#1a1a1a' }}>
          <button
            type="button"
            onClick={confirmMove}
            disabled={busy}
            className="w-full py-4 rounded-2xl font-semibold text-white active:scale-95"
            style={{ backgroundColor: 'var(--accent)', opacity: busy ? 0.6 : 1 }}
          >
            <div className="text-sm font-semibold">{busy ? t('Переносим...') : t('Перенести')}</div>
            <div className="text-xs opacity-75 mt-0.5">{t('{date} в {time}', { date: formatDisplayDate(day, { withYear: false, lang }), time: slot })}</div>
          </button>
        </div>
      )}

      {!active && (
        <div className="mx-6 mt-6">
          <Link to="/services" className="block w-full py-4 rounded-2xl text-white font-semibold text-center" style={{ backgroundColor: 'var(--accent)' }}>
            {t('Записаться снова')}
          </Link>
        </div>
      )}
    </div>
  )
}
