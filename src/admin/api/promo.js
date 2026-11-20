import staffApi from './staffClient'

// Привлечение: { enabled, site_url, days, masters: [{ id, name, link_slug, url }], sources: { stories: 3, … } | null }
export async function fetchPromo(days = 30) {
  const response = await staffApi.get('/promo/', { params: { days } })
  return response.data
}

// Короткая ссылка мастера: <сайт>/m/<link_slug>
export async function saveMasterLink(masterId, linkSlug) {
  const response = await staffApi.patch(`/promo/master/${masterId}/`, { link_slug: linkSlug })
  return response.data
}

// Свободные окна: { days: [{ date, masters: [{ id, name, windows: [{ from, to }] }] }] }
export async function fetchWindows({ date, days = 1, master = null }) {
  const response = await staffApi.get('/promo/windows/', { params: { date, days, ...(master ? { master } : {}) } })
  return response.data
}
