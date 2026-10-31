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
