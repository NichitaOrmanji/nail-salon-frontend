import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking } from '../context/BookingContext'
import { fetchSlots } from '../api/slots'
import Spinner from '../components/layout/Spinner'

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const DAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

function formatDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  )
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

function formatDisplayDate(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  return `${day} ${MONTHS[month - 1]}`
}

export default function SlotsPage() {
  const navigate = useNavigate()
  const { master, services, setDate, setTime, getNextRoute } = useBooking()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [slotsError, setSlotsError] = useState(null)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
    setSelectedSlot(null)
    setSlots([])
    setSlotsError(null)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
    setSelectedSlot(null)
    setSlots([])
    setSlotsError(null)
  }

  async function handleDayClick(day) {
    const date = formatDate(year, month, day)
    setSelectedDate(date)
    setDate(date)
    setSelectedSlot(null)
    setTime(null)
    setLoading(true)
    setSlotsError(null)

    try {
      const data = await fetchSlots({
        masterId: master?.id || '',
        serviceId: services[0]?.id || '',
        date
      })
      setSlots(data)
    } catch (err) {
      setSlots([])
      setSlotsError(err.message || 'Не удалось загрузить слоты')
    } finally {
      setLoading(false)
    }
  }

  const isToday = (day) => {
    const d = new Date()
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
  }

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
        <h2 className="text-white text-2xl font-bold tracking-tight">Дата и время</h2>
        <p className="text-gray-500 text-sm mt-1">Выберите удобный день</p>
      </div>

      <div className="px-6">

        {/* Навигация по месяцу */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-white font-semibold text-base">
            {MONTHS[month]} {year}
          </span>
          <div className="flex gap-2">
            <button
              onClick={prevMonth}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 transition-all active:scale-90"
              style={{ backgroundColor: '#242424' }}
            >
              <IconChevronLeft />
            </button>
            <button
              onClick={nextMonth}
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
            <div key={d} className="text-center text-gray-600 text-xs py-2 font-medium">{d}</div>
          ))}
        </div>

        {/* Числа */}
        <div className="grid grid-cols-7 gap-y-1">
          {Array(firstDay).fill(null).map((_, i) => <div key={`e-${i}`} />)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const day = i + 1
            const date = formatDate(year, month, day)
            const isSelected = selectedDate === date
            const isPast = new Date(date) < new Date(today.toDateString())
            const todayMark = isToday(day)

            return (
              <button
                key={day}
                onClick={() => !isPast && handleDayClick(day)}
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

            {loading && <Spinner text="Загружаем слоты..." />}

            {!loading && slotsError && (
              <div className="flex flex-col items-center py-8 gap-4">
                <p className="text-red-400 text-center text-sm">{slotsError}</p>
                <button
                  onClick={() => handleDayClick(new Date(selectedDate).getDate())}
                  className="px-6 py-3 rounded-2xl text-white text-sm font-medium active:scale-95"
                  style={{ backgroundColor: '#242424' }}
                >
                  Попробовать снова
                </button>
              </div>
            )}

            {!loading && !slotsError && slots.length > 0 && (
              <>
                <p className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-3">
                  Свободное время
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {slots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => { setSelectedSlot(slot); setTime(slot) }}
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
                <p className="text-white text-sm font-medium mb-1">Нет свободного времени</p>
                <p className="text-gray-500 text-sm">Попробуйте другую дату</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Кнопка далее */}
      {selectedSlot && (
        <div className="fixed bottom-0 left-0 right-0 p-4" style={{ backgroundColor: '#1a1a1a' }}>
          <button
            onClick={() => navigate(getNextRoute('slots'))}
            className="w-full py-4 rounded-2xl font-semibold text-white transition-all active:scale-95"
            style={{ backgroundColor: '#f472b6' }}
          >
            <div className="text-sm font-semibold">Далее</div>
            <div className="text-xs opacity-75 mt-0.5">{formatDisplayDate(selectedDate)} в {selectedSlot}</div>
          </button>
        </div>
      )}
    </div>
  )
}