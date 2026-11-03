import { useSyncExternalStore } from 'react'

// Цветовая тема: classic (прежняя тёмная), sea (светлое «Море»), sea-dark (тёмное «Море»).
// Выбор пользователя: auto (как в настройках телефона), light, dark, classic — хранится в браузере.
// Аварийный откат для всех: VITE_UI_THEME=classic в настройках Vercel → Redeploy (≈1 минута);
// выбор пользователей при этом игнорируется. Цвета — src/theme.css.
const KEY = 'ui-theme'
export const CHOICES = ['auto', 'light', 'dark', 'classic']
const FORCED = (import.meta.env.VITE_UI_THEME || '').trim()
const listeners = new Set()

function readChoice() {
  try {
    const saved = localStorage.getItem(KEY)
    if (CHOICES.includes(saved)) return saved
  } catch { /* хранилище недоступно */ }
  return 'auto'
}

function systemDark() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

let choice = readChoice()

export function resolveTheme(value = choice) {
  if (['classic', 'sea', 'sea-dark'].includes(FORCED)) return FORCED
  if (value === 'classic') return 'classic'
  if (value === 'light') return 'sea'
  if (value === 'dark') return 'sea-dark'
  return systemDark() ? 'sea-dark' : 'sea'
}

function apply() {
  if (typeof document === 'undefined') return
  const theme = resolveTheme()
  document.documentElement.dataset.theme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg-deep').trim() || '#111111')
}

// До первого рендера (main.jsx) — без мигания цветов
export function initTheme() {
  apply()
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    if (choice === 'auto') { apply(); listeners.forEach(l => l()) }
  })
}

export function getThemeChoice() {
  return choice
}

export function isThemeLocked() {
  return Boolean(FORCED)
}

export function setThemeChoice(next) {
  if (!CHOICES.includes(next)) return
  choice = next
  try { localStorage.setItem(KEY, next) } catch { /* хранилище недоступно */ }
  apply()
  listeners.forEach(l => l())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// Текущий выбор; компонент перерисуется при смене
export function useThemeChoice() {
  return useSyncExternalStore(subscribe, getThemeChoice)
}
