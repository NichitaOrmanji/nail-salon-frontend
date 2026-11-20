// Откуда пришёл клиент: метка ?from= в ссылке салона (сторис, Instagram…) или ссылка мастера.
// Хранится до конца вкладки и уходит вместе с записью — владелец видит, что работает
const KEY = 'booking_source'
const VALID = /^[a-z0-9_-]{1,30}$/

export function rememberSource(value) {
  const source = String(value || '').trim().toLowerCase()
  if (!VALID.test(source)) return
  try { sessionStorage.setItem(KEY, source) } catch { /* хранилище недоступно */ }
}

// Метка из адреса страницы (вызывается при открытии сайта)
export function captureSource() {
  try {
    rememberSource(new URLSearchParams(window.location.search).get('from'))
  } catch { /* старый браузер */ }
}

export function bookingSource() {
  try {
    return sessionStorage.getItem(KEY) || undefined
  } catch {
    return undefined
  }
}
