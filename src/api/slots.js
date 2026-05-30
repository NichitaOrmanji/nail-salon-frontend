import api, { SLUG } from './client'

export async function fetchSlots({ masterId, serviceId, date }) {
  const response = await api.get(`/companies/${SLUG}/slots/`, {
    params: {
      master: masterId,
      service: serviceId,
      date: date
    }
  })
  return response.data.slots
}