import api from './client'

// Ссылка «Управлять записью»: без входа, по секрету записи
export async function fetchManaged(token) {
  const response = await api.get(`/manage/${encodeURIComponent(token)}/`)
  return response.data
}

export async function cancelManaged(token) {
  const response = await api.post(`/manage/${encodeURIComponent(token)}/cancel/`)
  return response.data
}

export async function fetchManagedSlots(token, date) {
  const response = await api.get(`/manage/${encodeURIComponent(token)}/slots/`, { params: { date } })
  return Array.isArray(response.data?.slots) ? response.data.slots : []
}

export async function rescheduleManaged(token, { date, time }) {
  const response = await api.post(`/manage/${encodeURIComponent(token)}/reschedule/`, { date, start_time: time })
  return response.data
}
