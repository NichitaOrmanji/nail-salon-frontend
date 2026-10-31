import { nowMinutes, parseDate, timeToMin, todayString } from './time'

// Чёрный список: штраф 50 % (настройка салона) за неявку и отмену позже чем за N часов.
// Правила салона — в me.company: penalty_percent (0 — штрафы выключены), late_cancel_hours

export function penaltyAmount(appointment, company) {
  const percent = Number(company?.penalty_percent) || 0
  const price = Number(appointment?.service?.price) || 0
  return Math.round(price * percent) / 100
}

// Минуты до начала записи по времени салона (отрицательные — уже началась)
function minutesUntil(appointment) {
  const days = Math.round((parseDate(appointment.date) - parseDate(todayString())) / 86400000)
  return days * 1440 + timeToMin(appointment.start_time) - nowMinutes()
}

// Отмена сейчас — позже срока салона (за неё штраф, если клиент отменил сам)
export function isLateCancel(appointment, company) {
  const hours = Number(company?.late_cancel_hours) || 0
  return hours > 0 && Number(company?.penalty_percent) > 0 && minutesUntil(appointment) < hours * 60
}

export const PENALTY_KIND = { no_show: 'Не пришёл', late_cancel: 'Поздняя отмена' }
export const PENALTY_STATUS = {
  unpaid: { label: 'не оплачен', color: '#f87171' },
  paid: { label: 'оплачен', color: '#34d399' },
  forgiven: { label: 'прощён', color: '#9ca3af' },
}
