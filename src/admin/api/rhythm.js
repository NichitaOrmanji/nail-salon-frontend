import staffApi from './staffClient'

// Ритм клиента: { enabled, counts: {soon, leaving, lost}, stats: {invited, returned, revenue}, results }
export async function fetchRhythm(stage) {
  const response = await staffApi.get('/rhythm/', { params: { stage } })
  return response.data
}

// Сотрудник позвал клиента сам: channel — whatsapp | viber | phone
export async function markInvited({ phone, group, channel }) {
  const response = await staffApi.post('/rhythm/mark/', { phone, group, channel })
  return response.data
}
