import { tr } from '../../i18n'
// Статусы записи: подпись и цвет текста (CSS-переменные темы — читаются и в светлой, и в тёмной)
export const STATUSES = tr({
  pending: { label: 'Ожидает', color: 'var(--c-warn-2)' },
  confirmed: { label: 'Подтверждена', color: 'var(--c-ok)' },
  completed: { label: 'Пришёл', color: 'var(--c-muted)' },
  no_show: { label: 'Не пришёл', color: 'var(--c-danger)' },
  cancelled: { label: 'Отменена', color: 'var(--c-faint)' },
})

// Статусы, которые занимают время мастера (как BUSY_STATUSES на бэке)
export const BUSY_STATUSES = ['pending', 'confirmed', 'completed']
// «Предстоящие»: можно подтвердить или отменить
export const ACTIVE_STATUSES = ['pending', 'confirmed']

export function statusInfo(status) {
  return STATUSES[status] || { label: status || '—', color: 'var(--c-muted)' }
}

// Цвет записи в журнале: откуда пришла и чем закончилась (легенда — в том же порядке).
// color — точка в легенде; bg и line — фон и полоска блока (--k-* в index.css; не зависят от акцента)
const kind = (label, color, k) => ({ label, color, bg: `var(--k-${k}-bg)`, line: `var(--k-${k}-line)` })
export const KINDS = tr({
  online_confirmed: kind('Онлайн, подтверждена', 'var(--k-ok-line)', 'ok'),
  online_pending: kind('Онлайн, ждёт подтверждения', 'var(--k-warn-line)', 'warn'),
  staff: kind('Записал администратор', 'var(--k-info-line)', 'info'),
  completed: kind('Визит состоялся', 'var(--k-done-line)', 'done'),
  no_show: kind('Не пришёл', 'var(--k-bad-line)', 'bad'),
  cancelled: kind('Отменена', 'var(--k-off-line)', 'off'),
})

export function appointmentKind(a) {
  if (a.status === 'completed' || a.status === 'no_show' || a.status === 'cancelled') return KINDS[a.status]
  if (a.source === 'staff') return KINDS.staff
  return a.status === 'confirmed' ? KINDS.online_confirmed : KINDS.online_pending
}

export const ROLE_LABELS = tr({
  owner: 'Владелец',
  admin: 'Администратор',
  master: 'Мастер',
})

export function isManagerRole(role) {
  return role === 'owner' || role === 'admin'
}
