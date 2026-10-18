import api from './client'

// История записей залогиненного пользователя
export async function fetchMyAppointments() {
  const response = await api.get('/appointments/my/')
  return response.data
}

export async function cancelAppointment(id) {
  const response = await api.post(`/appointments/${id}/cancel/`)
  return response.data
}
