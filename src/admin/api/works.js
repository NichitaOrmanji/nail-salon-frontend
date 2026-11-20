import staffApi from './staffClient'

// Портфолио: блок «Работа» в карточке записи — { enabled, notes, photos, max_photos, previous }
export async function fetchVisitWork(appointmentId) {
  const response = await staffApi.get(`/works/visit/${appointmentId}/`)
  return response.data
}

export async function saveWorkNotes(appointmentId, notes) {
  const response = await staffApi.patch(`/works/visit/${appointmentId}/`, { notes })
  return response.data
}

export async function uploadVisitPhoto(appointmentId, file) {
  const body = new FormData()
  body.append('file', file, 'work.jpg')
  const response = await staffApi.post(`/works/visit/${appointmentId}/photos/`, body)
  return response.data
}

// Галерея мастера: { enabled, results }
export async function fetchMasterWorks(masterId) {
  const response = await staffApi.get(`/works/master/${masterId}/`)
  return response.data
}

export async function uploadMasterWork(masterId, file, serviceId) {
  const body = new FormData()
  body.append('file', file, 'work.jpg')
  if (serviceId) body.append('service', serviceId)
  const response = await staffApi.post(`/works/master/${masterId}/`, body)
  return response.data
}

// { public } — мастер: показывать на сайте; { hidden } — владелец или админ скрыл
export async function updateWorkPhoto(photoId, changes) {
  const response = await staffApi.patch(`/works/${photoId}/`, changes)
  return response.data
}

export async function deleteWorkPhoto(photoId) {
  await staffApi.delete(`/works/${photoId}/`)
}
