// Статусы записи: подпись и цвет
export const STATUSES = {
  pending: { label: 'Ожидает', color: '#f59e0b' },
  confirmed: { label: 'Подтверждена', color: '#34d399' },
  completed: { label: 'Пришёл', color: '#9ca3af' },
  no_show: { label: 'Не пришёл', color: '#f87171' },
  cancelled: { label: 'Отменена', color: '#6b7280' },
}

// Статусы, которые занимают время мастера (как BUSY_STATUSES на бэке)
export const BUSY_STATUSES = ['pending', 'confirmed', 'completed']
// «Предстоящие»: можно подтвердить или отменить
export const ACTIVE_STATUSES = ['pending', 'confirmed']

export function statusInfo(status) {
  return STATUSES[status] || { label: status || '—', color: '#9ca3af' }
}

// Цвет записи в журнале: откуда пришла и чем закончилась (легенда — в том же порядке)
export const KINDS = {
  online_confirmed: { label: 'Онлайн, подтверждена', color: '#34d399' },
  online_pending: { label: 'Онлайн, ждёт подтверждения', color: '#f59e0b' },
  staff: { label: 'Записал администратор', color: '#60a5fa' },
  completed: { label: 'Визит состоялся', color: '#9ca3af' },
  no_show: { label: 'Не пришёл', color: '#f87171' },
  cancelled: { label: 'Отменена', color: '#6b7280' },
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
