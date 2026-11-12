import { timeToMin, formatShortDate } from './time'
import { t } from '../../i18n'

// Ошибка в часах дня или обеде (null — всё верно). Обед — оба времени или ни одного, внутри дня
export function dayHoursError({ start_time, end_time, break_start, break_end }) {
  const start = timeToMin(start_time)
  const end = timeToMin(end_time)
  if (start === null || end === null) return t('Укажите время начала и окончания')
  if (start >= end) return t('Начало должно быть раньше конца')
  if (!break_start && !break_end) return null
  if (!break_start || !break_end) return t('Укажите и начало, и конец обеда')
  const bs = timeToMin(break_start)
  const be = timeToMin(break_end)
  if (bs === null || be === null) return t('Время обеда — ЧЧ:ММ')
  if (bs >= be) return t('Начало обеда должно быть раньше конца')
  if (bs <= start || be >= end) return t('Обед должен быть внутри рабочего дня')
  return null
}

// '10:00–19:00' и обед строкой для подписей
export function hoursLabel(day) {
  return day?.start_time && day?.end_time ? `${day.start_time}–${day.end_time}` : ''
}

export function lunchLabel(day) {
  return day?.break_start && day?.break_end ? `${day.break_start}–${day.break_end}` : ''
}

// Ошибка сохранения графика: мастеру сервер не даёт убрать часы с записями и присылает conflicts
export function scheduleErrorText(err) {
  const conflicts = Array.isArray(err?.data?.conflicts) ? err.data.conflicts : []
  if (!conflicts.length) return err?.message || t('Не удалось сохранить')
  const lines = conflicts.slice(0, 10).map(c => `• ${formatShortDate(c.date)}, ${c.start_time}–${c.end_time} · ${c.client_name} (${t(c.reason)})`)
  if (conflicts.length > 10) lines.push('…')
  return [err.message, ...lines].join('\n')
}
