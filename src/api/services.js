import api, { SLUG } from './client'

export async function fetchServices() {
  const response = await api.get(`/companies/${SLUG}/services/`)
  return response.data
}