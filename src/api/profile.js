import api from './client'

// История записей залогиненного пользователя
export async function fetchMyAppointments() {
  const response = await api.get('/appointments/my/')
  return response.data
}