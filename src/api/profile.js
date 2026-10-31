import api, { SLUG, expectArray } from './client'

// История записей залогиненного пользователя
export async function fetchMyAppointments() {
  const response = await api.get('/appointments/my/')
  return expectArray(response.data)
}

export async function cancelAppointment(id) {
  const response = await api.post(`/appointments/${id}/cancel/`)
  return response.data
}

// Неоплаченные штрафы клиента в салоне (чёрный список): { debt: '100.00', items: [{ date, kind, amount, service }] }
export async function fetchMyDebt() {
  const response = await api.get(`/companies/${SLUG}/my-debt/`)
  return response.data
}
