import { useSyncExternalStore } from 'react'
import RO from './ro'

// Язык: ru (основной) или ro. Тексты в коде — по-русски, t() берёт румынский перевод
// из ro.js по русскому тексту. У сайта записи и панели салона (/admin-panel) языки свои:
// клиент выбирает язык сайта, сотрудник — язык панели в «Настройках».
// Выбор запоминается в браузере; сайт без выбора — язык браузера, панель — русский.
const KEY = 'lang'
const ADMIN_KEY = 'admin_lang'
export const LANGS = ['ru', 'ro']

function isAdmin() {
  return typeof window !== 'undefined' && window.location.pathname.startsWith('/admin-panel')
}

function read(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    if (LANGS.includes(saved)) return saved
  } catch { /* хранилище недоступно */ }
  return fallback
}

const langs = {
  site: read(KEY, typeof navigator !== 'undefined' && (navigator.language || '').toLowerCase().startsWith('ro') ? 'ro' : 'ru'),
  admin: read(ADMIN_KEY, 'ru'),
}
const listeners = new Set()
if (typeof document !== 'undefined') document.documentElement.lang = getLang()

const CYR = /[А-Яа-яЁё]/
const proxies = new WeakMap()

// Константы уровня модуля (подписи статусов, вкладок, месяцев): строки переводятся при чтении,
// поэтому язык берётся в момент отрисовки, а не загрузки модуля. Объекты кэшируются — сравнение
// KINDS.x === KINDS.x остаётся верным
export function tr(value) {
  if (value === null || typeof value !== 'object') return value
  if (proxies.has(value)) return proxies.get(value)
  const proxy = new Proxy(value, {
    get(target, key, receiver) {
      const v = Reflect.get(target, key, receiver)
      if (typeof v === 'string') return CYR.test(v) ? t(v) : v
      return v && typeof v === 'object' ? tr(v) : v
    },
  })
  proxies.set(value, proxy)
  return proxy
}

export function getLang() {
  return isAdmin() ? langs.admin : langs.site
}

export function setLang(next) {
  const area = isAdmin() ? 'admin' : 'site'
  if (!LANGS.includes(next) || next === langs[area]) return
  langs[area] = next
  try { localStorage.setItem(area === 'admin' ? ADMIN_KEY : KEY, next) } catch { /* хранилище недоступно */ }
  document.documentElement.lang = next
  listeners.forEach(listener => listener())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Текущий язык; компонент перерисуется при переключении
export function useLang() {
  return useSyncExternalStore(subscribe, getLang)
}

// t('Свободны в {time}', { time }) — перевод на текущий язык с подстановками
export function t(text, params) {
  let out = text
  if (getLang() === 'ro') {
    out = RO[text]
    if (out === undefined) {
      if (import.meta.env.DEV) console.warn('[i18n] нет перевода:', text)
      out = text
    }
  }
  return params ? out.replace(/\{(\w+)\}/g, (match, key) => (key in params ? params[key] : match)) : out
}
