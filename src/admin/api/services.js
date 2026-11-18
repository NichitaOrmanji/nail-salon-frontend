import staffApi, { expectArray } from './staffClient'

// Все услуги салона, включая скрытые:
// { id, name, category, category_name, duration, price, is_active, photo }
export async function fetchStaffServices() {
  const response = await staffApi.get('/services/')
  return expectArray(response.data)
}

export async function createService(data) {
  const response = await staffApi.post('/services/', data)
  return response.data
}

export async function updateService(id, data) {
  const response = await staffApi.patch(`/services/${id}/`, data)
  return response.data
}

// Фото услуги; ответ — услуга целиком
export async function uploadServicePhoto(id, file) {
  const body = new FormData()
  body.append('file', file)
  const response = await staffApi.post(`/services/${id}/photo/`, body)
  return response.data
}

export async function deleteServicePhoto(id) {
  const response = await staffApi.delete(`/services/${id}/photo/`)
  return response.data
}

export async function fetchCategories() {
  const response = await staffApi.get('/categories/')
  return expectArray(response.data)
}

export async function createCategory(name) {
  const response = await staffApi.post('/categories/', { name })
  return response.data
}

export async function renameCategory(id, name) {
  const response = await staffApi.patch(`/categories/${id}/`, { name })
  return response.data
}

export async function deleteCategory(id) {
  await staffApi.delete(`/categories/${id}/`)
}
