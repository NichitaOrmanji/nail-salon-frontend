import staffApi, { expectArray } from './staffClient'

// Журнал: записи за период (статусы — массив или строка 'a,b')
export async function fetchAppointments({ dateFrom, dateTo, master, statuses } = {}) {
  const params = { date_from: dateFrom }
  if (dateTo) params.date_to = dateTo
  if (master) params.master = master
  if (statuses?.length) params.status = Array.isArray(statuses) ? statuses.join(',') : statuses
  const response = await staffApi.get('/appointments/', { params })
  return expectArray(response.data)
}

export async function fetchAppointment(id) {
  const response = await staffApi.get(`/appointments/${id}/`)
  return response.data
}

export async function createAppointment(data) {
  const response = await staffApi.post('/appointments/', data)
  return response.data
}

// В PATCH отправляются только изменённые поля
export async function updateAppointment(id, data) {
  const response = await staffApi.patch(`/appointments/${id}/`, data)
  return response.data
}

// Все будущие записи «Ожидает» (тот же набор, что считает бейдж; не больше 200)
export const MAX_PENDING_ITEMS = 200

export async function fetchPendingAppointments() {
  const response = await staffApi.get('/appointments/pending/')
  return expectArray(response.data)
}

export async function fetchPendingCount() {
  const response = await staffApi.get('/appointments/pending-count/')
  return Number(response.data?.count) || 0
}

// { times: ['10:00', …], working, day_off, schedule: { start_time, end_time, break_start, break_end } | null }
export async function fetchFreeTimes({ master, date, service, duration, exclude }) {
  const params = { master, date }
  if (duration) params.duration = duration
  else if (service) params.service = service
  if (exclude) params.exclude = exclude
  const response = await staffApi.get('/free-times/', { params })
  return response.data
}

// { phone, name, visits, no_shows, last_visit } или ошибка 404 «Клиент не найден»
export async function lookupClient(phone) {
  const response = await staffApi.get('/clients/lookup/', { params: { phone } })
  return response.data
}
