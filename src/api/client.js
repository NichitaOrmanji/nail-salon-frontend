import axios from 'axios'
import { getLang, t } from '../i18n'

// В продакшене (Vercel) запросы идут на /api того же домена,
// а vercel.json проксирует их на сервер бэкенда
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api')
})

// Автоматически добавляем токен если он есть
api.interceptors.request.use(config => {
  // Язык сайта: на нём бэкенд отвечает ошибками и пишет в Telegram
  config.headers['X-Lang'] = getLang()
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

// Ответ API — всегда JSON. HTML приходит, если адрес API или прокси
// настроены неверно и вместо бэкенда ответил сам фронтенд (index.html)
function checkJson(response) {
  const type = response.headers?.['content-type'] || ''
  if (typeof response.data === 'string' && type.includes('text/html')) {
    const url = `${response.config.baseURL || ''}${response.config.url || ''}`
    return Promise.reject(new Error(t('API вернул HTML вместо данных ({url}). Проверьте адрес API.', { url })))
  }
  return response
}

// Списки с бэкенда должны быть массивами — иначе страница упадёт на .map()
export function expectArray(data) {
  if (!Array.isArray(data)) {
    throw new Error(t('Сервер вернул данные в неожиданном формате.'))
  }
  return data
}

// Один общий запрос обновления токена на все параллельные 401
let refreshing = null
function refreshAccess() {
  if (!refreshing) {
    const refresh = localStorage.getItem('refresh_token')
    refreshing = (refresh
      ? axios.post(`${api.defaults.baseURL}/auth/refresh/`, { refresh }).then(response => {
        const access = response.data?.access
        if (!access) throw new Error('no access')
        localStorage.setItem('access_token', access)
        if (response.data.refresh) localStorage.setItem('refresh_token', response.data.refresh)
        return access
      })
      : Promise.reject(new Error('no refresh')))
      .finally(() => { refreshing = null })
  }
  return refreshing
}

// Перехватчик ошибок
api.interceptors.response.use(
  checkJson,
  error => {
    if (!error.response) {
      return Promise.reject(new Error(t('Нет соединения с сервером. Проверьте интернет.')))
    }
    const { status, data } = error.response
    const config = error.config

    if (status === 401) {
      // Токен входа живёт час: сначала один раз обновляем его по refresh-токену
      if (config.headers?.Authorization && !config._refreshed && !config._retried) {
        config._refreshed = true
        return refreshAccess().then(access => {
          config.headers.Authorization = `Bearer ${access}`
          return api(config)
        }, () => {
          // Не вышло (refresh истёк) — выходим и повторяем запрос без токена
          // (запись и просмотр услуг доступны и без входа)
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.dispatchEvent(new Event('auth:logout'))
          config._retried = true
          delete config.headers.Authorization
          return api(config)
        })
      }
      // Повтор с новым токеном снова получил 401 — выходим
      if (config.headers?.Authorization && !config._retried) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.dispatchEvent(new Event('auth:logout'))
        config._retried = true
        delete config.headers.Authorization
        return api(config)
      }
      return Promise.reject(new Error(t('Сессия истекла. Войдите снова.')))
    }

    const message = extractMessage(data)
    if (status === 400) {
      return Promise.reject(new Error(message || t('Неверные данные. Проверьте заполненные поля.')))
    }
    if (status === 404) {
      return Promise.reject(new Error(message || t('Данные не найдены.')))
    }
    if (status >= 500) {
      return Promise.reject(new Error(t('Ошибка сервера. Попробуйте позже.')))
    }
    return Promise.reject(new Error(message || t('Что-то пошло не так. Попробуйте ещё раз.')))
  }
)

export const SLUG = 'jcnails'

export default api
