// Общие элементы и подписи супер-админки

export const ACTIONS = {
  login: 'Вход',
  login_failed: 'Неверный код',
  totp_setup: 'Подключено приложение для кодов',
  totp_reset: 'Сброшен код из приложения',
  backup_codes_regenerated: 'Новые резервные коды',
  password_set: 'Задан пароль',
  salon_blocked: 'Салон заблокирован',
  salon_unblocked: 'Салон разблокирован',
  trial_extended: 'Продлён пробный период',
  verification_resent: 'Отправлено письмо подтверждения',
  password_reset_sent: 'Отправлена ссылка для сброса пароля',
  note_added: 'Добавлена заметка',
  impersonation_started: 'Вход в панель салона',
}

export const STATUS = {
  active: { label: 'Работает', color: '#34d399' },
  pending: { label: 'Ждёт подтверждения email', color: '#fbbf24' },
  blocked: { label: 'Заблокирован', color: '#f87171' },
}

export const TRIAL = {
  active: 'Пробный период',
  ending: 'Пробный кончается',
  expired: 'Пробный кончился',
  none: 'Без пробного периода',
}

const pad = n => String(n).padStart(2, '0')

export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

export function formatWhen(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${formatDate(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// «3 дня назад», «сегодня» — для последней активности
export function ago(iso) {
  if (!iso) return 'не входили'
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days <= 0) return 'сегодня'
  if (days === 1) return 'вчера'
  return `${days} дн. назад`
}
