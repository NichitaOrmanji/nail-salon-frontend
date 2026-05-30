import api, { SLUG } from './client'

export async function createAppointment(data) {
  const response = await api.post(`/companies/${SLUG}/appointments/`, data)
  return response.data
}