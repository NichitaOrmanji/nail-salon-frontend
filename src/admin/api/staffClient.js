import axios from 'axios'

// API персонала: /api/staff/…; токены хранятся отдельно от клиентских
const API_ROOT = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api')

const staffApi = axios.create({
  baseURL: API_ROOT + '/staff'
})

const ACCESS_KEY = 'staff_access_token'
const REFRESH_KEY = 'staff_refresh_token'

export const LOGIN_PATH = '/admin-panel/login'

function readStorage(key) {
  try { return localStorage.getItem(key) } catch { return null }
}

export function getStaffAccessToken() {
  return readStorage(ACCESS_KEY)
}

export function saveStaffTokens({ access, refresh }) {
  try {
    if (access) localStorage.setItem(ACCESS_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  } catch { /* хранилище недоступно */ }
}

// Номер сессии: растёт при каждом выходе. Ответы на запросы, отправленные
// до выхода (в т.ч. обновление токена), не должны вернуть токены в хранилище
let sessionGeneration = 0
// Общий запрос обновления токена (см. refreshAccessToken)
let refreshPromise = null

export function getStaffSessionGeneration() {
  return sessionGeneration
}

export function clearStaffTokens() {
  sessionGeneration += 1
  // Обновление токена старой сессии больше не общее для новых запросов
  refreshPromise = null
  try {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  } catch { /* хранилище недоступно */ }
}

// Выход из панели: чистим токены, StaffAuthContext ловит событие
// и RequireStaff уводит на страницу входа (message — почему вышли)
export function forceStaffLogout(message) {
  clearStaffTokens()
  window.dispatchEvent(new CustomEvent('staff:logout', { detail: { message } }))
  if (!window.location.pathname.startsWith(LOGIN_PATH)) {
    window.history.pushState({}, '', LOGIN_PATH)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}

// Вход и обновление токена — без Authorization и без повторов на 401
function isAuthUrl(url = '') {
  return url.startsWith('/auth/login') || url.startsWith('/auth/refresh')
}

// Подписи полей для ошибок вида { client_phone: ['…'] }
const FIELD_LABELS = {
  username: 'Логин',
  password: 'Пароль',
  old_password: 'Старый пароль',
  new_password: 'Новый пароль',
  client_name: 'Имя',
  client_phone: 'Телефон',
  client_email: 'Email',
  master: 'Мастер',
  service: 'Услуга',
  services: 'Услуги',
  date: 'Дата',
  date_from: 'Дата',
  date_to: 'Дата',
  start_time: 'Время',
  end_time: 'Время окончания',
  duration: 'Длительность',
  status: 'Статус',
  notes: 'Заметка',
  name: 'Название',
  category: 'Категория',
  price: 'Цена',
  is_active: 'Активность',
  description: 'Описание',
  address: 'Адрес',
  phone: 'Телефон',
  latitude: 'Широта',
  longitude: 'Долгота',
  day_of_week: 'День недели',
  schedule: 'График',
}

// Первый текст ошибки внутри значения (строка, массив, вложенный объект)
function firstText(value) {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    for (const item of value) {
      const text = firstText(item)
      if (text) return text
    }
    return null
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) {
      const text = firstText(item)
      if (text) return text
    }
  }
  return null
}

// Текст ошибки из ответа Django/DRF:
// { error }, { detail }, { non_field_errors: [...] }, { поле: [...] } -> «Подпись: текст»
export function extractMessage(data) {
  if (!data || typeof data !== 'object') return null
  if (typeof data.error === 'string') return data.error
  if (typeof data.detail === 'string') return data.detail
  if (Array.isArray(data)) return firstText(data)
  for (const [field, value] of Object.entries(data)) {
    const text = firstText(value)
    if (!text) continue
    if (field === 'non_field_errors' || field === 'detail' || field === 'error') return text
    return `${FIELD_LABELS[field] || field}: ${text}`
  }
  return null
}

// Ошибка с кодом ответа и телом — страницам иногда нужны детали (count и т.п.)
function apiError(message, status, data) {
  const error = new Error(message)
  error.status = status
  error.data = data
  return error
}

// Ответ API — всегда JSON. HTML приходит, если адрес API или прокси настроены неверно
function checkJson(response) {
  const type = response.headers?.['content-type'] || ''
  if (typeof response.data === 'string' && type.includes('text/html')) {
    const url = `${response.config.baseURL || ''}${response.config.url || ''}`
    return Promise.reject(new Error(`API вернул HTML вместо данных (${url}). Проверьте адрес API.`))
  }
  return response
}

// Списки с бэкенда должны быть массивами — иначе страница упадёт на .map()
export function expectArray(data) {
  if (!Array.isArray(data)) {
    throw new Error('Сервер вернул данные в неожиданном формате.')
  }
  return data
}

staffApi.interceptors.request.use(config => {
  config._generation = sessionGeneration
  const token = getStaffAccessToken()
  if (token && !isAuthUrl(config.url)) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Сессия завершилась (вышли), пока шёл запрос: ответ не применяем, повторов нет
function sessionEndedError() {
  const error = new Error('Сессия завершена. Войдите снова.')
  error.sessionEnded = true
  return error
}

// Один общий запрос обновления токена на все параллельные 401.
// Ошибка с refreshRejected — сервер отверг refresh-токен (400/401), нужно выйти;
// сетевая ошибка или 5xx — токены сохраняются, можно повторить позже
function refreshAccessToken() {
  if (!refreshPromise) {
    const refresh = readStorage(REFRESH_KEY)
    const generation = sessionGeneration
    if (!refresh) {
      const error = new Error('Нет refresh-токена')
      error.refreshRejected = true
      return Promise.reject(error)
    }
    const promise = staffApi.post('/auth/refresh/', { refresh })
      .then(response => {
        if (generation !== sessionGeneration) throw sessionEndedError()
        const access = response.data?.access
        if (!access) throw new Error('Ошибка сервера. Попробуйте позже.')
        // Пока шёл запрос, токены уже сменились (смена пароля, другая вкладка) —
        // не перетираем их, повтор возьмёт текущий access-токен
        if (readStorage(REFRESH_KEY) === refresh) {
          saveStaffTokens({ access, refresh: response.data?.refresh })
        }
        return access
      }, error => {
        if (generation !== sessionGeneration) throw sessionEndedError()
        const stored = readStorage(REFRESH_KEY)
        if (stored && stored !== refresh) {
          // Старый refresh-токен отвергнут, но уже сохранены новые — работаем с ними
          return getStaffAccessToken()
        }
        if (error?.status === 400 || error?.status === 401) error.refreshRejected = true
        throw error
      })
      .finally(() => {
        if (refreshPromise === promise) refreshPromise = null
      })
    refreshPromise = promise
  }
  return refreshPromise
}

// Тексты 403, при которых аккаунт больше не может работать в панели
const NO_ACCESS_MESSAGES = ['Нужен вход в панель салона', 'У этого аккаунта нет доступа к панели салона']

staffApi.interceptors.response.use(
  checkJson,
  async error => {
    if (!error.response) {
      return Promise.reject(new Error('Нет соединения с сервером. Проверьте интернет.'))
    }
    const { status, data } = error.response
    const config = error.config || {}
    const message = extractMessage(data)

    if (status === 401 && !isAuthUrl(config.url)) {
      // Запрос ушёл до выхода из панели — ничего не обновляем и не выходим повторно
      if (config._generation !== sessionGeneration) {
        return Promise.reject(sessionEndedError())
      }
      if (!config._retried) {
        let refreshed = false
        try {
          await refreshAccessToken()
          refreshed = true
        } catch (refreshError) {
          if (refreshError?.sessionEnded) return Promise.reject(refreshError)
          if (!refreshError?.refreshRejected) {
            // Нет сети или ошибка сервера: токены не трогаем, следующий запрос попробует снова
            return Promise.reject(refreshError instanceof Error ? refreshError : new Error('Ошибка сервера. Попробуйте позже.'))
          }
          // refresh-токен недействителен — ниже выходим из панели
        }
        if (refreshed) {
          if (config._generation !== sessionGeneration) return Promise.reject(sessionEndedError())
          // Новый токен подставит перехватчик запроса
          config._retried = true
          return staffApi(config)
        }
      }
      // Параллельный запрос уже вывел из панели — второй раз не выходим
      if (config._generation !== sessionGeneration) return Promise.reject(sessionEndedError())
      const text = 'Сессия истекла. Войдите снова.'
      forceStaffLogout(text)
      return Promise.reject(apiError(text, status, data))
    }

    if (status === 403 && (config.url?.startsWith('/me') || NO_ACCESS_MESSAGES.includes(message))) {
      const text = message || 'У этого аккаунта нет доступа к панели салона'
      forceStaffLogout(text)
      return Promise.reject(apiError(text, status, data))
    }

    if (status === 400) {
      return Promise.reject(apiError(message || 'Неверные данные. Проверьте заполненные поля.', status, data))
    }
    if (status === 403) {
      return Promise.reject(apiError(message || 'Недостаточно прав.', status, data))
    }
    if (status === 404) {
      // Django отдаёт «No Master matches the given query.» по-английски — такое не показываем
      const text = message && !/matches the given query/i.test(message) ? message : 'Данные не найдены.'
      return Promise.reject(apiError(text, status, data))
    }
    if (status === 429) {
      return Promise.reject(apiError(message || 'Слишком много попыток. Попробуйте позже.', status, data))
    }
    if (status >= 500) {
      return Promise.reject(apiError('Ошибка сервера. Попробуйте позже.', status, data))
    }
    return Promise.reject(apiError(message || 'Что-то пошло не так. Попробуйте ещё раз.', status, data))
  }
)

export default staffApi
