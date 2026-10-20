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

// Салон работает по времени Кишинёва (как бэкенд) — «сегодня» и «сейчас»
// не зависят от часового пояса устройства
const SALON_TIME_ZONE = 'Europe/Chisinau'
let salonFormatter = null

// { date: 'YYYY-MM-DD', minutes } — текущие дата и время салона
function salonNow() {
  const now = new Date()
  try {
    if (!salonFormatter) {
      salonFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: SALON_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
    }
    const parts = {}
    for (const part of salonFormatter.formatToParts(now)) parts[part.type] = part.value
    const date = `${parts.year}-${parts.month}-${parts.day}`
    const minutes = (Number(parts.hour) % 24) * 60 + Number(parts.minute)
    if (isValidDateString(date) && Number.isFinite(minutes)) return { date, minutes }
  } catch { /* браузер не знает часовой пояс — берём время устройства */ }
  return { date: toDateString(now), minutes: now.getHours() * 60 + now.getMinutes() }
}

export function todayString() {
  return salonNow().date
}

export function addDays(dateStr, days) {
  const d = parseDate(dateStr)
  d.setDate(d.getDate() + days)
  return toDateString(d)
}

// Только существующие даты: '2026-02-30' не «перекатывается» в 2 марта
export function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = parseDate(value)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
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

// Минуты от полуночи сейчас (по времени салона)
export function nowMinutes() {
  return salonNow().minutes
}

// Запятая -> точка: «12,5» -> «12.5»
export function normalizeDecimal(value) {
  return String(value ?? '').trim().replace(',', '.')
}
