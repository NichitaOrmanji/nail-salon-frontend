import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking } from '../context/BookingContext'
import { fetchSlots, fetchSlotsByMaster, fetchFreePoints } from '../api/slots'
import Spinner from '../components/layout/Spinner'
import SalonHeader from '../components/layout/SalonHeader'
import { PAGE_WIDTH } from '../components/layout/width'
import { formatDisplayDate, toDateString } from '../utils/format'
import { getLang, t } from '../i18n'

// Переводятся при показе: константа модуля не знает о смене языка
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const DAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

function IconChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  )
}

// Свободное время на дату с учётом того, что уже выбрано:
// конкретный мастер → его слоты; «любой» → слоты всех мастеров услуги;
// услуга ещё не выбрана → свободное время салона
async function loadSlots({ master, service, date }) {
  if (service && master?.id) {
    return fetchSlots({ masterId: master.id, serviceId: service.id, date })
  }
  if (service) {
    const byTime = await fetchSlotsByMaster({ serviceId: service.id, date })
    return Object.keys(byTime).sort()
  }
  return fetchFreePoints(date)
}

// Бэкенд не отсекает уже прошедшее время сегодняшнего дня
function dropPastSlots(slots, date) {
  const now = new Date()
  if (date !== toDateString(now)) return slots
  const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return slots.filter(slot => slot > current)
}

export default function SlotsPage() {
  const navigate = useNavigate()
  const { master, service, date, time, setDate, setTime, getNextRoute } = useBooking()
  const today = new Date()
  const todayStr = toDateString(today)
  const initial = date ? new Date(`${date}T00:00`) : today
  const [year, setYear] = useState(initial.getFullYear())
  const [month, setMonth] = useState(initial.getMonth())
  const [selectedDate, setSelectedDate] = useState(date)
  const [selectedSlot, setSelectedSlot] = useState(time)
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [slotsError, setSlotsError] = useState(null)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()

  async function selectDate(dateStr) {
    setSelectedDate(dateStr)
    setDate(dateStr)
    setSelectedSlot(null)
    setTime(null)
    setLoading(true)
    setSlotsError(null)
    try {
      const data = await loadSlots({ master, service, date: dateStr })
      setSlots(dropPastSlots(data, dateStr))
    } catch (err) {
      setSlots([])
      setSlotsError(err.message || t('Не удалось загрузить слоты'))
    } finally {
      setLoading(false)
    }
  }

  // Вернулись на шаг — подгружаем слоты для уже выбранной даты
  useEffect(() => {
    if (!date) return
    loadSlots({ master, service, date })
      .then(data => setSlots(dropPastSlots(data, date)))
      .catch(err => setSlotsError(err.message || t('Не удалось загрузить слоты')))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function changeMonth(delta) {
    const d = new Date(year, month + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
    setSelectedDate(null)
    setSelectedSlot(null)
    setSlots([])
    setSlotsError(null)
  }

  function selectSlot(slot) {
    setSelectedSlot(slot)
    setTime(slot)
  }

  const subtitle = service
    ? `${service.name}${master?.id ? ` · ${master.name}` : ''}`
    : t('Выберите удобный день')

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: '#1a1a1a' }}>

      <SalonHeader />

      {/* Заголовок */}
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-white text-2xl font-bold tracking-tight">{t('Дата и время')}</h2>
        <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
      </div>

      <div className="px-6">

        {/* Навигация по месяцу */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-white font-semibold text-base">
            {t(MONTHS[month])} {year}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => changeMonth(-1)}
              disabled={isCurrentMonth}
              aria-label={t('Предыдущий месяц')}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 transition-all active:scale-90"
              style={{ backgroundColor: '#242424', opacity: isCurrentMonth ? 0.3 : 1 }}
            >
              <IconChevronLeft />
            </button>
            <button
              onClick={() => changeMonth(1)}
              aria-label={t('Следующий месяц')}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 transition-all active:scale-90"
              style={{ backgroundColor: '#242424' }}
            >
              <IconChevronRight />
            </button>
          </div>
        </div>

        {/* Дни недели */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-gray-600 text-xs py-2 font-medium">{t(d)}</div>
          ))}
        </div>

        {/* Числа */}
        <div className="grid grid-cols-7 gap-y-1">
          {Array(firstDay).fill(null).map((_, i) => <div key={`e-${i}`} />)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const day = i + 1
            const dateStr = toDateString(new Date(year, month, day))
            const isSelected = selectedDate === dateStr
            const isPast = dateStr < todayStr
            const todayMark = dateStr === todayStr

            return (
              <button
                key={day}
                onClick={() => selectDate(dateStr)}
                disabled={isPast}
                className="flex items-center justify-center h-10 w-10 mx-auto rounded-xl text-sm transition-all active:scale-90"
                style={{
                  backgroundColor: isSelected ? '#f472b6' : todayMark ? '#242424' : 'transparent',
                  color: isPast ? '#374151' : '#ffffff',
                  fontWeight: todayMark ? '700' : '400',
                }}
              >
                {day}
              </button>
            )
          })}
        </div>

        {/* Слоты */}
        {selectedDate && (
          <div className="mt-8">

            {loading && <Spinner text={t('Загружаем слоты...')} />}

            {!loading && slotsError && (
              <div className="flex flex-col items-center py-8 gap-4">
                <p className="text-red-400 text-center text-sm">{slotsError}</p>
                <button
                  onClick={() => selectDate(selectedDate)}
                  className="px-6 py-3 rounded-2xl text-white text-sm font-medium active:scale-95"
                  style={{ backgroundColor: '#242424' }}
                >
                  {t('Попробовать снова')}
                </button>
              </div>
            )}

            {!loading && !slotsError && slots.length > 0 && (
              <>
                <p className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-3">
                  {t('Свободное время')}
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                  {slots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => selectSlot(slot)}
                      className="py-3 rounded-xl text-sm font-medium transition-all active:scale-95"
                      style={{
                        backgroundColor: selectedSlot === slot ? '#f472b6' : '#242424',
                        color: selectedSlot === slot ? '#ffffff' : '#9ca3af'
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </>
            )}

            {!loading && !slotsError && slots.length === 0 && (
              <div className="text-center py-8">
                <p className="text-white text-sm font-medium mb-1">{t('Нет свободного времени')}</p>
                <p className="text-gray-500 text-sm">{t('Попробуйте другую дату')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Кнопка далее */}
      {selectedSlot && (
        <div className={`fixed bottom-0 left-0 right-0 mx-auto w-full ${PAGE_WIDTH} p-4`} style={{ backgroundColor: '#1a1a1a' }}>
          <button
            onClick={() => navigate(getNextRoute('slots'))}
            className="w-full py-4 rounded-2xl font-semibold text-white transition-all active:scale-95"
            style={{ backgroundColor: '#f472b6' }}
          >
            <div className="text-sm font-semibold">{t('Далее')}</div>
            <div className="text-xs opacity-75 mt-0.5">{t('{date} в {time}', { date: formatDisplayDate(selectedDate, { withYear: false, lang: getLang() }), time: selectedSlot })}</div>
          </button>
        </div>
      )}
    </div>
  )
}
