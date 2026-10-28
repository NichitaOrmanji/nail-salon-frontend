import { useSyncExternalStore } from 'react'
import RO from './ro'

// Язык сайта записи: ru (основной) или ro. Тексты в коде — по-русски, t() берёт
// румынский перевод из ro.js по русскому тексту. Панель салона не переводится.
// Выбор запоминается в браузере; без выбора — язык браузера.
const KEY = 'lang'
export const LANGS = ['ru', 'ro']

function detect() {
  try {
    const saved = localStorage.getItem(KEY)
    if (LANGS.includes(saved)) return saved
  } catch { /* хранилище недоступно */ }
  return (navigator.language || '').toLowerCase().startsWith('ro') ? 'ro' : 'ru'
}

let lang = detect()
const listeners = new Set()
if (typeof document !== 'undefined') document.documentElement.lang = lang

export function getLang() {
  return lang
}

export function setLang(next) {
  if (!LANGS.includes(next) || next === lang) return
  lang = next
  try { localStorage.setItem(KEY, next) } catch { /* хранилище недоступно */ }
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
  if (lang === 'ro') {
    out = RO[text]
    if (out === undefined) {
      if (import.meta.env.DEV) console.warn('[i18n] нет перевода:', text)
      out = text
    }
  }
  return params ? out.replace(/\{(\w+)\}/g, (match, key) => (key in params ? params[key] : match)) : out
}
