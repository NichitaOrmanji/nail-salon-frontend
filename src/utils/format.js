const MONTHS_GENITIVE = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']

// DRF отдаёт DecimalField строкой ("350.00")
export function formatPrice(price) {
  return `${Number(price)} L`
}

export function sumPrice(services) {
  return services.reduce((sum, s) => sum + Number(s.price), 0)
}

export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h && m) return `${h} ч ${m} мин`
  if (h) return `${h} ч`
  return `${m} мин`
}

// '2026-10-18' -> '18 октября 2026'
export function formatDisplayDate(dateStr, { withYear = true } = {}) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  return withYear ? `${day} ${MONTHS_GENITIVE[month - 1]} ${year}` : `${day} ${MONTHS_GENITIVE[month - 1]}`
}

// Локальная дата в формате YYYY-MM-DD (toISOString сдвигает в UTC)
export function toDateString(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
