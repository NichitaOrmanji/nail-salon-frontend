import staffApi from './staffClient'

// Чёрный список: действия со штрафом. Ответ — штраф { id, kind, status, amount, date, time, service, ... }
export async function payPenalty(id, method) {
  const response = await staffApi.post(`/penalties/${id}/pay/`, { method })
  return response.data
}

export async function forgivePenalty(id, note) {
  const response = await staffApi.post(`/penalties/${id}/forgive/`, { note })
  return response.data
}

// Отменить оплату штрафа (только владелец)
export async function cancelPenaltyPayment(id) {
  const response = await staffApi.delete(`/penalties/${id}/pay/`)
  return response.data
}

// Должники салона: { total_debt, debtors, penalties, paid_this_month, results: [{ phone, name, debt,
//   next_visit: { id, date, time, master } | null, penalties: [{ id, kind, amount, date, time, service, master }] }] }
export async function fetchDebtors() {
  const response = await staffApi.get('/debtors/')
  return response.data
}
