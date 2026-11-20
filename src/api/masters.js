import api, { SLUG, expectArray } from './client'

// serviceId — показать только мастеров, которые делают эту услугу
export async function fetchMasters({ serviceId } = {}) {
  const response = await api.get(`/companies/${SLUG}/masters/`, {
    params: serviceId ? { service: serviceId } : {}
  })
  return expectArray(response.data).filter(m => m.is_active !== false)
}

// Услуги мастера с его ценой и длительностью
export async function fetchMasterServices(masterId) {
  const response = await api.get(`/companies/${SLUG}/master/${masterId}/services/`)
  return expectArray(response.data)
}

// Работы мастера (портфолио): [{ id, url, service: { id, name, price } | null }]
export async function fetchMasterWorks(masterId) {
  const response = await api.get(`/companies/${SLUG}/masters/${masterId}/works/`)
  return expectArray(response.data)
}

// Отзывы о мастере: { avg_rating, reviews_count, reviews: [{ id, client_name, rating, comment, created_at }] }
export async function fetchMasterReviews(masterId) {
  const response = await api.get(`/companies/${SLUG}/master/${masterId}/reviews/`)
  return response.data
}
