// Статусы записи: подпись и цвет. Цвета — переменные темы (src/theme.css, --st-*):
// оттенок по смыслу один во всех темах, яркость подобрана под фон темы
export const STATUSES = {
  pending: { label: 'Ожидает', color: 'var(--st-amber)' },
  confirmed: { label: 'Подтверждена', color: 'var(--st-green)' },
  completed: { label: 'Пришёл', color: 'var(--st-gray)' },
  no_show: { label: 'Не пришёл', color: 'var(--st-red)' },
  cancelled: { label: 'Отменена', color: 'var(--st-gray2)' },
}

// Статусы, которые занимают время мастера (как BUSY_STATUSES на бэке)
export const BUSY_STATUSES = ['pending', 'confirmed', 'completed']
// «Предстоящие»: можно подтвердить или отменить
export const ACTIVE_STATUSES = ['pending', 'confirmed']

export function statusInfo(status) {
  return STATUSES[status] || { label: status || '—', color: 'var(--st-gray)' }
}

// Цвет записи в журнале: откуда пришла и чем закончилась (легенда — в том же порядке)
export const KINDS = {
  online_confirmed: { label: 'Онлайн, подтверждена', color: 'var(--st-green)' },
  online_pending: { label: 'Онлайн, ждёт подтверждения', color: 'var(--st-amber)' },
  staff: { label: 'Записал администратор', color: 'var(--st-blue)' },
  completed: { label: 'Визит состоялся', color: 'var(--st-gray)' },
  no_show: { label: 'Не пришёл', color: 'var(--st-red)' },
  cancelled: { label: 'Отменена', color: 'var(--st-gray2)' },
}

export function appointmentKind(a) {
  if (a.status === 'completed' || a.status === 'no_show' || a.status === 'cancelled') return KINDS[a.status]
  if (a.source === 'staff') return KINDS.staff
  return a.status === 'confirmed' ? KINDS.online_confirmed : KINDS.online_pending
}

export const ROLE_LABELS = {
  owner: 'Владелец',
  admin: 'Администратор',
  master: 'Мастер',
}

export function isManagerRole(role) {
  return role === 'owner' || role === 'admin'
}
