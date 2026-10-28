const MONTHS_GENITIVE = {
  ru: ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],
  ro: ['ianuarie','februarie','martie','aprilie','mai','iunie','iulie','august','septembrie','octombrie','noiembrie','decembrie'],
}

// DRF отдаёт DecimalField строкой ("350.00")
export function formatPrice(price) {
  return `${Number(price)} L`
}

export function sumPrice(services) {
  return services.reduce((sum, s) => sum + Number(s.price), 0)
}

// lang — язык сайта записи (getLang()); панель салона — всегда по-русски
export function formatDuration(minutes, lang = 'ru') {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const [hours, mins] = lang === 'ro' ? ['h', 'min'] : ['ч', 'мин']
  if (h && m) return `${h} ${hours} ${m} ${mins}`
  if (h) return `${h} ${hours}`
  return `${m} ${mins}`
}

// '2026-10-18' -> '18 октября 2026' (ro: '18 octombrie 2026')
export function formatDisplayDate(dateStr, { withYear = true, lang = 'ru' } = {}) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  const name = (MONTHS_GENITIVE[lang] || MONTHS_GENITIVE.ru)[month - 1]
  return withYear ? `${day} ${name} ${year}` : `${day} ${name}`
}

// Локальная дата в формате YYYY-MM-DD (toISOString сдвигает в UTC)
export function toDateString(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
