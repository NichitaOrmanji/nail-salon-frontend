import staffApi from './staffClient'

// Клиентская база (владелец и админ). Клиент — номер телефона из записей салона.
// { count, page_size, results: [{ phone, name, total, visits, no_shows, cancelled, paid, average_check,
//   first_date, last_visit, next_visit }] }
// blacklist — только клиенты из чёрного списка; у каждого клиента blacklist: { debt, count } | null
export async function fetchClients({ q = '', sort = 'last', page = 1, blacklist = false } = {}) {
  const response = await staffApi.get('/clients/', { params: { q: q || undefined, sort, page, blacklist: blacklist ? 1 : undefined } })
  return response.data
}

// То же + top_master, top_service, note, note_updated_at, appointments: [{ id, date, start_time, status,
//   service, master, price, paid, notes }]
export async function fetchClientCard(phone) {
  const response = await staffApi.get('/clients/card/', { params: { phone } })
  return response.data
}

export async function saveClientNote(phone, text) {
  const response = await staffApi.put('/clients/note/', { phone, text })
  return response.data
}

// Удалить данные клиента по его обращению: записи обезличиваются, заметка и штрафы удаляются → { anonymized }
export async function forgetClient(phone) {
  const response = await staffApi.post('/clients/forget/', { phone })
  return response.data
}
