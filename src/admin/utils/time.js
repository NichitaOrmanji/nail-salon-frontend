import { toDateString } from '../../utils/format'

export { toDateString }

const WEEKDAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
export const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTHS_GENITIVE = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']

// 'HH:MM' -> минуты от полуночи (null, если строка не похожа на время)
export function timeToMin(time) {
  if (typeof time !== 'string') return null
  const match = time.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

// минуты от полуночи -> 'HH:MM'
export function minToTime(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// 'YYYY-MM-DD' -> локальная дата (без сдвига в UTC)
export function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayString() {
  return toDateString(new Date())
}

export function addDays(dateStr, days) {
  const d = parseDate(dateStr)
  d.setDate(d.getDate() + days)
  return toDateString(d)
}

export function isValidDateString(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseDate(value).getTime())
}

// День недели как у бэка (Python weekday): 0 — понедельник … 6 — воскресенье
export function weekdayIndex(dateStr) {
  return (parseDate(dateStr).getDay() + 6) % 7
}

// '2026-10-20' -> 'Вторник, 20 октября'
export function formatDayTitle(dateStr) {
  const d = parseDate(dateStr)
  return `${WEEKDAYS[weekdayIndex(dateStr)]}, ${d.getDate()} ${MONTHS_GENITIVE[d.getMonth()]}`
}

// '2026-10-20' -> 'Вт, 20 октября'
export function formatShortDate(dateStr) {
  const d = parseDate(dateStr)
  return `${WEEKDAYS_SHORT[weekdayIndex(dateStr)]}, ${d.getDate()} ${MONTHS_GENITIVE[d.getMonth()]}`
}

// Минуты от полуночи сейчас
export function nowMinutes() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

// Запятая -> точка: «12,5» -> «12.5»
export function normalizeDecimal(value) {
  return String(value ?? '').trim().replace(',', '.')
}
