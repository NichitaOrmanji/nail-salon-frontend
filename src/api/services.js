import api, { SLUG, expectArray } from './client'

// masterId — услуги конкретного мастера;
// date + time — услуги, на которые есть свободный мастер в это время
export async function fetchServices({ masterId, date, time } = {}) {
  const params = {}
  if (masterId) {
    params.master_id = masterId
  } else if (date && time) {
    params.date = date
    params.time = time
  }
  const response = await api.get(`/companies/${SLUG}/services/`, { params })
  return expectArray(response.data)
}
