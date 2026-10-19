import staffApi from './staffClient'

// { id, slug, name, address, phone, description, latitude, longitude }
export async function fetchStaffCompany() {
  const response = await staffApi.get('/company/')
  return response.data
}

export async function updateStaffCompany(data) {
  const response = await staffApi.patch('/company/', data)
  return response.data
}
