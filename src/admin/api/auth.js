import staffApi from './staffClient'

// Вход: { access, refresh, me }
export async function staffLogin(username, password) {
  const response = await staffApi.post('/auth/login/', { username, password })
  return response.data
}

// { id, username, name, role, company: { id, slug, name }, master_id }
export async function fetchStaffMe() {
  const response = await staffApi.get('/me/')
  return response.data
}

export async function changePassword(oldPassword, newPassword) {
  await staffApi.post('/auth/password/', { old_password: oldPassword, new_password: newPassword })
}
