import { timeToMin } from './time'

// Ошибка в часах дня или обеде (null — всё верно). Обед — оба времени или ни одного, внутри дня
export function dayHoursError({ start_time, end_time, break_start, break_end }) {
  const start = timeToMin(start_time)
  const end = timeToMin(end_time)
  if (start === null || end === null) return 'Укажите время начала и окончания'
  if (start >= end) return 'Начало должно быть раньше конца'
  if (!break_start && !break_end) return null
  if (!break_start || !break_end) return 'Укажите и начало, и конец обеда'
  const bs = timeToMin(break_start)
  const be = timeToMin(break_end)
  if (bs === null || be === null) return 'Время обеда — ЧЧ:ММ'
  if (bs >= be) return 'Начало обеда должно быть раньше конца'
  if (bs <= start || be >= end) return 'Обед должен быть внутри рабочего дня'
  return null
}

// '10:00–19:00' и обед строкой для подписей
export function hoursLabel(day) {
  return day?.start_time && day?.end_time ? `${day.start_time}–${day.end_time}` : ''
}

export function lunchLabel(day) {
  return day?.break_start && day?.break_end ? `${day.break_start}–${day.break_end}` : ''
}
