import api, { SLUG, expectArray } from './client'
import { fetchMasters } from './masters'

// Свободное время конкретного мастера на конкретную услугу
export async function fetchSlots({ masterId, serviceId, date }) {
  const response = await api.get(`/companies/${SLUG}/slots/`, {
    params: {
      master: masterId,
      service: serviceId,
      date: date
    }
  })
  return expectArray(response.data?.slots)
}

// Свободное время всех мастеров, которые делают услугу.
// Возвращает { 'HH:MM': [masterId, ...] }
export async function fetchSlotsByMaster({ serviceId, date }) {
  const masters = await fetchMasters({ serviceId })
  // Сбой у одного мастера не скрывает свободное время остальных; ошибка — только если не ответил никто
  const results = await Promise.allSettled(
    masters.map(m =>
      fetchSlots({ masterId: m.id, serviceId, date }).then(slots => ({ id: m.id, slots }))
    )
  )
  const loaded = results.filter(r => r.status === 'fulfilled').map(r => r.value)
  if (results.length && !loaded.length) throw results[0].reason
  const byTime = {}
  for (const { id, slots } of loaded) {
    for (const slot of slots) {
      (byTime[slot] ||= []).push(id)
    }
  }
  return byTime
}

// Свободное время салона без привязки к услуге (шаг 30 минут)
export async function fetchFreePoints(date) {
  const response = await api.get(`/companies/${SLUG}/points/`, { params: { date } })
  return expectArray(response.data)
}
