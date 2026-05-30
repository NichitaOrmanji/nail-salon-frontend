import api, { SLUG } from './client'

export async function fetchMasters() {
  const response = await api.get(`/companies/${SLUG}/masters/`)
  return response.data
}