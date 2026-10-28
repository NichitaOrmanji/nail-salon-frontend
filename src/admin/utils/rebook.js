// «Записать снова» из карточки клиента: страница клиентов кладёт { phone, name },
// журнал открывает с ними форму новой записи и удаляет их
export const REBOOK_KEY = 'staff:rebook'

export function readRebook() {
  try {
    const data = JSON.parse(sessionStorage.getItem(REBOOK_KEY) || 'null')
    return data && typeof data.phone === 'string' ? data : null
  } catch {
    return null
  }
}

export function clearRebook() {
  try { sessionStorage.removeItem(REBOOK_KEY) } catch { /* хранилище недоступно */ }
}
