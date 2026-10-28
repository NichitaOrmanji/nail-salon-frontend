import { addDays, todayString, weekdayIndex } from './time'

export const METHODS = [
  { key: 'cash', label: 'Наличные' },
  { key: 'card', label: 'Карта' },
  { key: 'transfer', label: 'Перевод' },
]

export function methodLabel(key) {
  return METHODS.find(m => m.key === key)?.label || key
}

// '1250.50' -> '1 250,50 L'; целые — без копеек
export function formatMoney(value) {
  const number = Number(value) || 0
  const text = number.toLocaleString('ru-RU', {
    minimumFractionDigits: Number.isInteger(number) ? 0 : 2,
    maximumFractionDigits: 2,
  })
  return `${text} L`
}

// Готовые периоды отчётов: { key, label, dateFrom, dateTo }
export function presetRange(key, today = todayString()) {
  if (key === 'today') return { dateFrom: today, dateTo: today }
  if (key === 'yesterday') {
    const day = addDays(today, -1)
    return { dateFrom: day, dateTo: day }
  }
  if (key === 'week') {
    const monday = addDays(today, -weekdayIndex(today))
    return { dateFrom: monday, dateTo: addDays(monday, 6) }
  }
  // Месяц: с 1-го числа по последнее
  const [y, m] = today.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  const mm = String(m).padStart(2, '0')
  return { dateFrom: `${y}-${mm}-01`, dateTo: `${y}-${mm}-${String(last).padStart(2, '0')}` }
}

export const PRESETS = [
  { key: 'today', label: 'Сегодня' },
  { key: 'yesterday', label: 'Вчера' },
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
]
