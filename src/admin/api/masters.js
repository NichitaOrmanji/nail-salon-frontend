import staffApi, { expectArray } from './staffClient'

// owner/admin — все мастера салона, master — только он сам:
// { id, name, description, is_active, photo, services: [ids], schedule: [7], user?, has_access }
export async function fetchStaffMasters() {
  const response = await staffApi.get('/masters/')
  return expectArray(response.data)
}

export async function createMaster(data) {
  const response = await staffApi.post('/masters/', data)
  return response.data
}

export async function updateMaster(id, data) {
  const response = await staffApi.patch(`/masters/${id}/`, data)
  return response.data
}

// Скрыть мастера. Без force при будущих записях — 400 { error, count }
export async function hideMaster(id, { force = false } = {}) {
  await staffApi.delete(`/masters/${id}/`, { params: force ? { force: 1 } : {} })
}

export async function fetchSchedule(masterId) {
  const response = await staffApi.get(`/masters/${masterId}/schedule/`)
  return expectArray(response.data)
}

// Ровно 7 дней: { day_of_week, is_working, start_time, end_time }
export async function saveSchedule(masterId, days) {
  const response = await staffApi.put(`/masters/${masterId}/schedule/`, days)
  return response.data
}

// [{ id, master, date }]
export async function fetchDaysOff({ dateFrom, dateTo }) {
  const response = await staffApi.get('/days-off/', { params: { date_from: dateFrom, date_to: dateTo } })
  return expectArray(response.data)
}

// Ответ включает appointments_count — активные записи мастера на эту дату
export async function addDayOff(masterId, date) {
  const response = await staffApi.post(`/masters/${masterId}/days-off/`, { date })
  return response.data
}

export async function removeDayOff(masterId, date) {
  await staffApi.delete(`/masters/${masterId}/days-off/${date}/`)
}

// Дать доступ в панель / сменить логин или пароль: { username, has_access }
export async function setMasterAccess(masterId, username, password) {
  const response = await staffApi.post(`/masters/${masterId}/access/`, { username, password })
  return response.data
}

export async function revokeMasterAccess(masterId) {
  await staffApi.delete(`/masters/${masterId}/access/`)
}

// Фото мастера; ответ — мастер целиком
export async function uploadMasterPhoto(masterId, file) {
  const body = new FormData()
  body.append('file', file)
  const response = await staffApi.post(`/masters/${masterId}/photo/`, body)
  return response.data
}

export async function deleteMasterPhoto(masterId) {
  const response = await staffApi.delete(`/masters/${masterId}/photo/`)
  return response.data
}

// График по датам: [{ date, source: template|custom|off|template_off, is_working, start_time, end_time,
//   break_start, break_end, appointments }]
export async function fetchMasterDays(masterId, { dateFrom, dateTo }) {
  const response = await staffApi.get(`/masters/${masterId}/days/`, { params: { date_from: dateFrom, date_to: dateTo } })
  return expectArray(response.data)
}

// { dates: [...], mode: custom|off|template, start_time, end_time, break_start, break_end } →
// { days: [...], conflicts: [{ id, date, start_time, end_time, client_name, reason }] }
export async function saveMasterDays(masterId, body) {
  const response = await staffApi.put(`/masters/${masterId}/days/`, body)
  return response.data
}

// Рабочие дни по датам всех мастеров (для журнала): [{ master, date, start_time, end_time, break_start, break_end }]
export async function fetchWorkDays({ dateFrom, dateTo }) {
  const response = await staffApi.get('/work-days/', { params: { date_from: dateFrom, date_to: dateTo } })
  return expectArray(response.data)
}
