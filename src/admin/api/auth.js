import staffApi, { saveStaffTokens, getStaffSessionGeneration } from './staffClient'

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

// После смены пароля старые токены недействительны — бэк отдаёт новые { access, refresh }
export async function changePassword(oldPassword, newPassword) {
  const generation = getStaffSessionGeneration()
  const response = await staffApi.post('/auth/password/', { old_password: oldPassword, new_password: newPassword })
  // Пока шёл запрос, из панели вышли — новые токены не сохраняем
  if (generation === getStaffSessionGeneration() && response.data?.access) {
    saveStaffTokens(response.data)
  }
}
