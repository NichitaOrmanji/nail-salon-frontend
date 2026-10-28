import staffApi from './staffClient'

// { id, slug, name, address, phone, description, latitude, longitude, cancel_hours, logo, main_photo }
export async function fetchStaffCompany() {
  const response = await staffApi.get('/company/')
  return response.data
}

export async function updateStaffCompany(data) {
  const response = await staffApi.patch('/company/', data)
  return response.data
}

// Фото салона: kind — 'logo' | 'main-photo'. Ответ — салон целиком (logo, main_photo — адреса или null)
export async function uploadCompanyPhoto(kind, file) {
  const body = new FormData()
  body.append('file', file)
  const response = await staffApi.post(`/company/${kind}/`, body)
  return response.data
}

export async function deleteCompanyPhoto(kind) {
  const response = await staffApi.delete(`/company/${kind}/`)
  return response.data
}
