// Какой салон показывает сайт записи:
// 1) ?salon=slug в адресе (запоминается на вкладку — для демо и проверки),
// 2) поддомен: jcnails.timepoint.tech → jcnails, demo.timepoint.tech → demo,
// 3) иначе — салон по умолчанию (VITE_DEFAULT_SALON, jcnails).
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,49}$/
const STORAGE_KEY = 'salon'
const BASE_DOMAINS = ['timepoint.tech']
const NOT_SALONS = ['www', 'api', 'app', 'admin']
export const DEFAULT_SALON = import.meta.env.VITE_DEFAULT_SALON || 'jcnails'

function fromQuery() {
  try {
    const value = new URLSearchParams(window.location.search).get('salon')?.toLowerCase()
    if (value && SLUG_RE.test(value)) {
      sessionStorage.setItem(STORAGE_KEY, value)
      return value
    }
    const saved = sessionStorage.getItem(STORAGE_KEY)
    return saved && SLUG_RE.test(saved) ? saved : null
  } catch {
    return null
  }
}

function fromHost(host = window.location.hostname) {
  for (const base of BASE_DOMAINS) {
    if (host.endsWith(`.${base}`)) {
      const sub = host.slice(0, -base.length - 1)
      if (SLUG_RE.test(sub) && !NOT_SALONS.includes(sub)) return sub
    }
  }
  return null
}

export function resolveSalon() {
  if (typeof window === 'undefined') return DEFAULT_SALON
  return fromQuery() || fromHost() || DEFAULT_SALON
}
