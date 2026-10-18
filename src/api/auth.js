import api from './client'

// Регистрация
export async function register({ phone, password, name, surname }) {
  const response = await api.post('/auth/register/', { phone, password, name, surname })
  return response.data // { access, refresh }
}

// Вход
export async function login(phone, password) {
  const response = await api.post('/auth/login/', { phone, password })
  return response.data // { access, refresh }
}
