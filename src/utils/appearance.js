// Оформление: тема панели (тёмная / светлая «Графит» / как в системе) и акцентный цвет.
// Цвета интерфейса — CSS-переменные (src/index.css). Здесь — только атрибут темы на <html>
// и оттенки акцента (--acc-d-* для тёмной, --acc-l-* для светлой), подобранные по контрасту.

export const DEFAULT_ACCENT = '#DB2777'
export const THEMES = ['dark', 'light', 'system']
const HEX_RE = /^#[0-9A-Fa-f]{6}$/
const CACHE_KEY = 'tp-appearance'

// Готовые цвета в настройках
export const ACCENT_PRESETS = [
  { hex: '#DB2777', name: 'Розовый' },
  { hex: '#E11D48', name: 'Малиновый' },
  { hex: '#7C3AED', name: 'Фиолетовый' },
  { hex: '#4F46E5', name: 'Индиго' },
  { hex: '#2563EB', name: 'Синий' },
  { hex: '#0D9488', name: 'Бирюзовый' },
  { hex: '#059669', name: 'Изумрудный' },
  { hex: '#D97706', name: 'Янтарный' },
  { hex: '#C2410C', name: 'Терракота' },
  { hex: '#52525B', name: 'Графит' },
  { hex: '#F472B6', name: 'Пудровый' },
]

// Только #RRGGBB: значение попадает в CSS, другие форматы не пропускаем
export function normalizeHex(value) {
  const v = String(value || '').trim()
  return HEX_RE.test(v) ? v.toUpperCase() : ''
}

const toRgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
const toHex = rgb => '#' + rgb.map(c => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('').toUpperCase()
const mix = (a, b, t) => a.map((c, i) => c + (b[i] - c) * t)
const WHITE = [255, 255, 255]
const BLACK = [0, 0, 0]

function luminance(rgb) {
  const [r, g, b] = rgb.map(c => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a, b) {
  const [x, y] = [luminance(typeof a === 'string' ? toRgb(a) : a), luminance(typeof b === 'string' ? toRgb(b) : b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

// Сдвигаем цвет к target, пока контраст с фоном не станет ≥ min
function fit(rgb, against, target, min) {
  let c = rgb
  for (let i = 0; i < 40 && contrast(c, against) < min; i++) c = mix(c, target, 0.05)
  return c
}

// Все оттенки акцента для обеих тем. changed — цвет пришлось затемнить, чтобы белый текст на кнопках читался
export function accentShades(hex) {
  const base = toRgb(normalizeHex(hex) || DEFAULT_ACCENT)
  const fill = fit(base, WHITE, BLACK, 4.5) // кнопка с белым текстом
  const darkSurface = toRgb('#242424')
  const darkInk = fit(base, darkSurface, WHITE, 4.5) // текст и выделение на тёмном
  const lightInk = fit(base, toRgb('#F4F4F5'), BLACK, 4.5) // текст на светлом
  const dark = {
    '': toHex(fill),
    '-ink': toHex(darkInk),
    '-ink-2': toHex(mix(darkInk, WHITE, 0.35)),
    '-500': toHex(mix(fill, WHITE, 0.12)),
    '-soft': toHex(mix(toRgb('#1a1a1a'), base, 0.14)),
    '-soft-2': toHex(mix(toRgb('#1a1a1a'), base, 0.2)),
    '-mid': toHex(mix(toRgb('#1a1a1a'), base, 0.55)),
  }
  const light = {
    '': toHex(fill),
    '-ink': toHex(lightInk),
    '-ink-2': toHex(fit(base, WHITE, BLACK, 7)),
    '-500': toHex(fill),
    '-soft': toHex(mix(WHITE, base, 0.1)),
    '-soft-2': toHex(mix(WHITE, base, 0.2)),
    '-mid': toHex(mix(WHITE, base, 0.7)),
  }
  return { dark, light, fill: toHex(fill), changed: toHex(fill) !== toHex(base) }
}

const SUFFIXES = ['', '-ink', '-ink-2', '-500', '-soft', '-soft-2', '-mid']

function setAccentVars(el, hex, { light = true } = {}) {
  const value = normalizeHex(hex)
  if (!value || value === DEFAULT_ACCENT) {
    clearAccentVars(el)
    return
  }
  const shades = accentShades(value)
  for (const s of SUFFIXES) {
    el.style.setProperty(`--acc-d${s}`, shades.dark[s])
    if (light) el.style.setProperty(`--acc-l${s}`, shades.light[s])
  }
}

function clearAccentVars(el) {
  for (const s of SUFFIXES) {
    el.style.removeProperty(`--acc-d${s}`)
    el.style.removeProperty(`--acc-l${s}`)
  }
}

export function systemPrefersLight() {
  try {
    return window.matchMedia?.('(prefers-color-scheme: light)').matches || false
  } catch {
    return false
  }
}

export function resolveTheme(theme) {
  if (theme === 'light') return 'light'
  if (theme === 'system') return systemPrefersLight() ? 'light' : 'dark'
  return 'dark'
}

// Панель: тема + свой акцент сотрудника
export function applyAdminAppearance({ theme, accent } = {}) {
  const el = document.documentElement
  if (resolveTheme(theme) === 'light') el.setAttribute('data-admin-theme', 'light')
  else el.removeAttribute('data-admin-theme')
  setAccentVars(el, accent)
}

// Сайт записи: всегда тёмный, акцент — цвет салона
export function applyBookingAccent(accent) {
  setAccentVars(document.documentElement, accent, { light: false })
}

export function clearAppearance() {
  const el = document.documentElement
  el.removeAttribute('data-admin-theme')
  clearAccentVars(el)
}

export function cleanAppearance(value) {
  const theme = THEMES.includes(value?.theme) ? value.theme : 'dark'
  return { theme, accent: normalizeHex(value?.accent) }
}

// Последнее оформление в этом браузере — чтобы панель сразу открывалась в своей теме, без мелькания
export function readCachedAppearance() {
  try {
    return cleanAppearance(JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'))
  } catch {
    return cleanAppearance(null)
  }
}

export function cacheAppearance(value) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cleanAppearance(value)))
  } catch { /* хранилище недоступно */ }
}
