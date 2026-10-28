import staffApi, { expectArray } from './staffClient'

// Оплата визита: { method: 'cash' | 'card' | 'transfer', discount }
export async function checkoutAppointment(id, data) {
  const response = await staffApi.post(`/appointments/${id}/checkout/`, data)
  return response.data
}

// Отменить оплату (только владелец)
export async function cancelPayment(id) {
  await staffApi.delete(`/appointments/${id}/checkout/`)
}

const period = ({ dateFrom, dateTo }) => ({ date_from: dateFrom, date_to: dateTo })

export async function fetchSummary(range) {
  const response = await staffApi.get('/finance/summary/', { params: period(range) })
  return response.data
}

export async function fetchCashDay(date) {
  const response = await staffApi.get('/finance/cash/', { params: { date } })
  return response.data
}

// { operations, income_categories, expense_categories }
export async function fetchOperations(range) {
  const response = await staffApi.get('/finance/operations/', { params: period(range) })
  return response.data
}

export async function createOperation(data) {
  const response = await staffApi.post('/finance/operations/', data)
  return response.data
}

export async function deleteOperation(id) {
  await staffApi.delete(`/finance/operations/${id}/`)
}

export async function fetchSalaries(range) {
  const response = await staffApi.get('/finance/salaries/', { params: period(range) })
  return expectArray(response.data)
}

export async function saveSalaryScheme(masterId, data) {
  const response = await staffApi.put(`/finance/salaries/${masterId}/scheme/`, data)
  return response.data
}

export async function paySalary(masterId, data) {
  const response = await staffApi.post(`/finance/salaries/${masterId}/payouts/`, data)
  return response.data
}

export async function cancelPayout(id) {
  await staffApi.delete(`/finance/payouts/${id}/`)
}

export async function fetchMySalary(range) {
  const response = await staffApi.get('/finance/my-salary/', { params: period(range) })
  return response.data
}
