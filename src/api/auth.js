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

// Профиль залогиненного клиента: { phone, name, surname }
export async function fetchMe() {
  const response = await api.get('/auth/me/')
  return response.data
}

// Вход через Telegram: { token, url, expires_in } — ссылка на бота
export async function telegramLoginStart() {
  const response = await api.post('/auth/telegram/start/')
  return response.data
}

// Код из бота → { access, refresh }
export async function telegramLoginVerify(token, code) {
  const response = await api.post('/auth/telegram/verify/', { token, code })
  return response.data
}
