import { todayString, addDays } from './time'
import { t } from '../../i18n'

// Подтвердил ли клиент, что придёт (отдельно от статуса записи — статус решает салон)
const ACTIVE = ['pending', 'confirmed']

function whenText(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Текст для карточки записи: { confirmed, text, hint }
export function visitStatus(a) {
  if (a.visit_confirmed) {
    const how = a.visit_confirmed === 'telegram' ? t('в Telegram') : t('по телефону')
    return { confirmed: true, text: t('✓ Клиент подтвердил, что придёт ({how}, {when})', { how, when: whenText(a.visit_confirmed_at) }) }
  }
  return {
    confirmed: false,
    text: t('Клиент ещё не подтвердил, что придёт'),
    hint: a.reminder?.telegram
      ? t('Бот спросит его в напоминании за сутки. Если не ответит — позвоните.')
      : t('Telegram не подключён — позвоните клиенту накануне и отметьте.'),
  }
}

// Значок на блоке в журнале: ✓ — подтвердил; на сегодня и завтра: ⏳ — ждём ответа в Telegram, ☎ — позвонить
export function visitMark(a, today = todayString()) {
  if (!ACTIVE.includes(a.status)) return null
  if (a.visit_confirmed) return { icon: '✓', title: t('Клиент подтвердил, что придёт'), color: 'var(--c-ok)' }
  if (a.date < today || a.date > addDays(today, 1)) return null
  if (a.reminder?.telegram) return { icon: '⏳', title: t('Клиент ещё не ответил в Telegram'), color: 'var(--c-warn)' }
  return { icon: '☎', title: t('Нет Telegram — позвоните клиенту'), color: 'var(--c-warn)' }
}
