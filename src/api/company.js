import api, { SLUG } from './client'

export async function fetchCompany() {
  const response = await api.get(`/companies/${SLUG}/info/`)
  return response.data
}
