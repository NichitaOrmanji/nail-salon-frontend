import staffApi from './staffClient'

// Клиентская база (владелец и админ). Клиент — номер телефона из записей салона.
// { count, page_size, results: [{ phone, name, total, visits, no_shows, cancelled, paid, average_check,
//   first_date, last_visit, next_visit }] }
export async function fetchClients({ q = '', sort = 'last', page = 1 } = {}) {
  const response = await staffApi.get('/clients/', { params: { q: q || undefined, sort, page } })
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
