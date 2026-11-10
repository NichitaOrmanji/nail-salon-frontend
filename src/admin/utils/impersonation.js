// Вход супер-админа в панель салона: отметка в localStorage (общая для вкладок),
// чтобы по выходу или истечению сессии вернуться в карточку салона в супер-админке
const KEY = 'staff_impersonation'

export function readImpersonation() {
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}

export function startImpersonation(info) {
  try { localStorage.setItem(KEY, JSON.stringify(info)) } catch { /* хранилище недоступно */ }
}

// Снимает отметку; возвращает адрес, куда вернуться (null — входа от имени салона не было)
export function endImpersonation() {
  const info = readImpersonation()
  try { localStorage.removeItem(KEY) } catch { /* хранилище недоступно */ }
  if (!info) return null
  return info.salonId ? `/superadmin/salons/${info.salonId}` : '/superadmin'
}
