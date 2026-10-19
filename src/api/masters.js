import api, { SLUG, expectArray } from './client'

// serviceId — показать только мастеров, которые делают эту услугу
export async function fetchMasters({ serviceId } = {}) {
  const response = await api.get(`/companies/${SLUG}/masters/`, {
    params: serviceId ? { service: serviceId } : {}
  })
  return expectArray(response.data).filter(m => m.is_active !== false)
}
