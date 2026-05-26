import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking } from '../context/BookingContext'

const SLOTS = {
  '2026-05-27': ['10:00', '11:30', '13:00', '15:00', '16:30'],
  '2026-05-28': ['09:00', '12:00', '14:00'],
  '2026-05-30': ['11:00', '13:30', '17:00'],
}

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

export default function SlotsPage() {
  const navigate = useNavigate()
  const { setDate, setTime, getNextRoute } = useBooking()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  function handleDayClick(day) {
  const date = formatDate(year, month, day)
  setSelectedDate(date)
  setDate(date)
  setSelectedSlot(null)
  setTime(null)
}

  const nearestDate = Object.keys(SLOTS).sort()[0]
  const slots = selectedDate ? (SLOTS[selectedDate] || []) : []
  const isToday = (day) => {
    const d = new Date()
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
  }

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: '#1a1a1a' }}>

      {/* Шапка */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
        <button onClick={() => navigate(-1)} className="text-white text-xl px-2">‹</button>
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sm">💅</div>
        <div>
          <div className="text-white text-sm font-semibold">Название салона</div>
          <div className="text-gray-400 text-xs">ул. Пушкина, 1</div>
        </div>
      </div>

      <div className="px-6 py-6">

        {/* Навигация по месяцам */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="px-4 py-2 rounded-full flex items-center gap-2 text-white font-medium"
            style={{ backgroundColor: '#2a2a2a' }}
          >
            {MONTHS[month]} ▾
          </button>
          <div className="flex gap-4">
            <button onClick={prevMonth} className="text-gray-400 text-xl">‹</button>
            <button onClick={nextMonth} className="text-gray-400 text-xl">›</button>
          </div>
        </div>

        {/* Дни недели */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className="text-center text-gray-500 text-sm py-2">{d}</div>
          ))}
        </div>

        {/* Календарь */}
        <div className="grid grid-cols-7 gap-y-1">
          {Array(firstDay).fill(null).map((_, i) => <div key={`e-${i}`} />)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const day = i + 1
            const date = formatDate(year, month, day)
            const hasSlots = !!SLOTS[date]
            const isSelected = selectedDate === date
            const isPast = new Date(date) < new Date(today.toDateString())

            return (
              <button
                key={day}
                onClick={() => !isPast && handleDayClick(day)}
                disabled={isPast}
                className="flex items-center justify-center h-10 w-10 mx-auto rounded-full text-sm transition-all"
                style={{
                  backgroundColor: isSelected ? '#f472b6' : 'transparent',
                  color: isPast ? '#4b5563' : isSelected ? '#fff' : hasSlots ? '#ffffff' : '#9ca3af',
                  fontWeight: isToday(day) || hasSlots ? '600' : '400',
                }}
              >
                {day}
              </button>
            )
          })}
        </div>

        {/* Слоты или сообщение */}
        {selectedDate && (
          <div className="mt-8">
            {slots.length > 0 ? (
              <>
                <h3 className="text-white font-semibold mb-4">Выберите время</h3>
                <div className="grid grid-cols-4 gap-3">
                  {slots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => { setSelectedSlot(slot); setTime(slot) }}
                      className="py-3 rounded-xl text-sm font-medium transition-all"
                      style={{
                        backgroundColor: selectedSlot === slot ? '#f472b6' : '#2a2a2a',
                        color: '#ffffff'
                      }}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-white font-semibold text-lg mb-2">В этот день нет свободного времени</p>
                <p className="text-gray-400 text-sm mb-6">Ближайшая доступная дата:<br />{nearestDate}</p>
                <button
                  onClick={() => {
                    const [y, m, d] = nearestDate.split('-')
                    setYear(Number(y))
                    setMonth(Number(m) - 1)
                    setSelectedDate(nearestDate)
                  }}
                  className="px-6 py-3 rounded-full text-white font-medium"
                  style={{ backgroundColor: '#f472b6' }}
                >
                  Перейти к ближайшей дате
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedSlot && (
  <div className="fixed bottom-0 left-0 right-0 p-4" style={{ backgroundColor: '#1a1a1a' }}>
    <button
      onClick={() => navigate(getNextRoute('slots'))}
      className="w-full py-4 rounded-2xl font-semibold text-white"
      style={{ backgroundColor: '#f472b6' }}
    >
      Далее — {selectedDate} в {selectedSlot}
    </button>
  </div>
)}

    </div>
  )
}