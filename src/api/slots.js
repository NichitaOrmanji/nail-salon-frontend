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

// Загруженность дней месяца для календаря с кружками: { 'YYYY-MM-DD': { working, load, free } }
export async function fetchMonthLoad({ month, serviceId, masterId }) {
  const params = { month }
  if (serviceId) params.service = serviceId
  if (masterId) params.master = masterId
  const response = await api.get(`/companies/${SLUG}/calendar/`, { params })
  return Object.fromEntries(expectArray(response.data?.days).map(d => [d.date, d]))
}

// Ближайшие окна мастеров: [{ master, date, slots: ['HH:MM'] }]
export async function fetchNearestSlots({ serviceId }) {
  const response = await api.get(`/companies/${SLUG}/nearest/`, { params: serviceId ? { service: serviceId } : {} })
  return expectArray(response.data)
}

// Визит из нескольких услуг подряд: варианты начала с частями
// items — [{ service, master }]; ответ — [{ start_time, end_time, parts: [{ master_name, service_name, start_time, ... }] }]
export async function fetchVisitSlots({ items, date }) {
  const query = items.map(i => (i.master ? `${i.service}:${i.master}` : `${i.service}`)).join(',')
  const response = await api.get(`/companies/${SLUG}/visit-slots/`, { params: { date, items: query } })
  return expectArray(response.data?.slots)
}
