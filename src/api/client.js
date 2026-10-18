import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
})

// Автоматически добавляем токен если он есть
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Достаём текст ошибки из ответа Django/DRF:
// { error: '...' }, { detail: '...' }, { non_field_errors: ['...'] }, { field: ['...'] }
function extractMessage(data) {
  if (!data || typeof data !== 'object') return null
  if (typeof data.error === 'string') return data.error
  if (typeof data.detail === 'string') return data.detail
  for (const value of Object.values(data)) {
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
    if (typeof value === 'string') return value
  }
  return null
}

// Перехватчик ошибок
api.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      return Promise.reject(new Error('Нет соединения с сервером. Проверьте интернет.'))
    }
    const { status, data } = error.response
    const config = error.config

    if (status === 401) {
      // Токен устарел — выходим из аккаунта и повторяем запрос без токена
      // (запись и просмотр услуг доступны и без входа)
      if (config.headers?.Authorization && !config._retried) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.dispatchEvent(new Event('auth:logout'))
        config._retried = true
        delete config.headers.Authorization
        return api(config)
      }
      return Promise.reject(new Error('Сессия истекла. Войдите снова.'))
    }

    const message = extractMessage(data)
    if (status === 400) {
      return Promise.reject(new Error(message || 'Неверные данные. Проверьте заполненные поля.'))
    }
    if (status === 404) {
      return Promise.reject(new Error(message || 'Данные не найдены.'))
    }
    if (status >= 500) {
      return Promise.reject(new Error('Ошибка сервера. Попробуйте позже.'))
    }
    return Promise.reject(new Error(message || 'Что-то пошло не так. Попробуйте ещё раз.'))
  }
)

export const SLUG = 'jcnails'

export default api
