// Статусы записи: подпись и цвет
export const STATUSES = {
  pending: { label: 'Ожидает', color: '#f59e0b' },
  confirmed: { label: 'Подтверждена', color: '#34d399' },
  completed: { label: 'Пришёл', color: '#60a5fa' },
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

export const ROLE_LABELS = {
  owner: 'Владелец',
  admin: 'Администратор',
  master: 'Мастер',
}

export function isManagerRole(role) {
  return role === 'owner' || role === 'admin'
}
