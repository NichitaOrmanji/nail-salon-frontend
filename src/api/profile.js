import api, { expectArray } from './client'

// История записей залогиненного пользователя
export async function fetchMyAppointments() {
  const response = await api.get('/appointments/my/')
  return expectArray(response.data)
}

export async function cancelAppointment(id) {
  const response = await api.post(`/appointments/${id}/cancel/`)
  return response.data
}
