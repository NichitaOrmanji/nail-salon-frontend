import axios from 'axios'
import { extractMessage } from '../admin/api/staffClient'

// API супер-админки: /api/super/…. Токен живёт 4 часа и хранится только в этой вкладке
// (sessionStorage): закрыли вкладку — вход заново с кодом из приложения
const API_ROOT = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api')
const TOKEN_KEY = 'super_token'
export const SUPER_LOGIN_PATH = '/superadmin/login'

const api = axios.create({ baseURL: API_ROOT + '/super' })

export function getSuperToken() {
  try { return sessionStorage.getItem(TOKEN_KEY) } catch { return null }
}

export function saveSuperToken(token) {
  try { sessionStorage.setItem(TOKEN_KEY, token) } catch { /* хранилище недоступно */ }
}

export function clearSuperToken() {
  try { sessionStorage.removeItem(TOKEN_KEY) } catch { /* хранилище недоступно */ }
}

api.interceptors.request.use(config => {
  const token = getSuperToken()
  if (token && !config.url.startsWith('/auth/login') && !config.url.startsWith('/auth/verify')) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status
    const message = extractMessage(error.response?.data) || (status ? `Ошибка ${status}` : 'Нет связи с сервером')
    if (status === 401 && getSuperToken()) {
      clearSuperToken()
      window.dispatchEvent(new CustomEvent('super:logout', { detail: { message } }))
    }
    const wrapped = new Error(message)
    wrapped.status = status
    return Promise.reject(wrapped)
  }
)

export async function superLogin(username, password) {
  return (await api.post('/auth/login/', { username, password })).data
}

export async function superVerify(ticket, code) {
  return (await api.post('/auth/verify/', { ticket, code })).data
}

export async function fetchSuperMe() {
  return (await api.get('/me/')).data
}

export async function fetchSuperLog() {
  return (await api.get('/log/')).data
}

export async function regenerateBackupCodes(code) {
  return (await api.post('/auth/backup-codes/', { code })).data
}

// Вход в панель салона от имени владельца → { access, expires_at, salon }
export async function impersonateSalon(id) {
  return (await api.post(`/salons/${id}/impersonate/`)).data
}

export async function fetchOverview() {
  return (await api.get('/overview/')).data
}

export async function fetchSalons(params = {}) {
  return (await api.get('/salons/', { params })).data
}

export async function fetchSalon(id) {
  return (await api.get(`/salons/${id}/`)).data
}

// action: status | trial | resend-verification | verify | password-reset | note → свежая карточка салона
export async function salonAction(id, action, data = {}) {
  return (await api.post(`/salons/${id}/${action}/`, data)).data
}

export async function fetchHealth() {
  return (await api.get('/health/')).data
}

// Тревоги в Telegram: статус, ссылка для подключения, отключение, проверка
export async function fetchSuperTelegram() {
  return (await api.get('/telegram/')).data
}

export async function linkSuperTelegram() {
  return (await api.post('/telegram/')).data
}

export async function unlinkSuperTelegram() {
  await api.delete('/telegram/')
}

export async function testSuperTelegram() {
  return (await api.post('/telegram/test/')).data
}
