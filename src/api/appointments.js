import api, { SLUG } from './client'

export async function createAppointment(data) {
  const response = await api.post(`/companies/${SLUG}/appointments/`, data)
  return response.data
}
// Визит из нескольких услуг подряд одной записью
export async function createVisit(data) {
  const response = await api.post(`/companies/${SLUG}/visits/`, data)
  return response.data
}
