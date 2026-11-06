import { useEffect, useState } from 'react'
import Modal from '../../Modal'
import Spinner from '../../../../components/layout/Spinner'
import { ErrorText } from '../../ui'
import { fetchAppointmentHistory } from '../../../api/appointments'
import { statusInfo } from '../../../utils/statuses'
import { formatMoney, methodLabel } from '../../../utils/money'
import { formatShortDate } from '../../../utils/time'
import { t } from '../../../../i18n'

const ACTIONS = {
  created: 'Запись создана',
  updated: 'Изменения',
  paid: 'Оплата',
  payment_cancelled: 'Оплата отменена',
  reminded: 'Отправлено напоминание',
  repeated: 'Запись повторена',
  service_added: 'Добавлена услуга',
  cancelled_by_client: 'Клиент отменил запись',
  rescheduled_by_client: 'Клиент перенёс запись',
  confirmed_by_client: 'Клиент подтвердил запись',
}

const FIELDS = {
  status: 'Статус', master: 'Мастер', service: 'Услуга', date: 'Дата', start_time: 'Начало', end_time: 'Конец',
  price: 'Цена', discount: 'Скидка, %', buffer_minutes: 'Технический перерыв', client_name: 'Имя клиента',
  client_phone: 'Телефон', client_email: 'Email', notes: 'Комментарий', booker_name: 'Кто записывал',
  booker_phone: 'Телефон записавшего',
}

function shown(field, value) {
  if (value === '' || value === null || value === undefined) return '—'
  if (field === 'status') return statusInfo(value).label
  if (field === 'date') return formatShortDate(value)
  return value
}

function whenText(iso) {
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${formatShortDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function who(entry) {
  if (entry.actor === 'client') return t('Клиент')
  return entry.user || t('Персонал')
}

function Details({ entry }) {
  const d = entry.details || {}
  if (entry.action === 'updated' || entry.action === 'rescheduled_by_client') {
    return (
      <ul className="mt-1 space-y-0.5">
        {Object.entries(d).map(([field, pair]) => (
          <li key={field} className="text-gray-400">
            {t(FIELDS[field] || field)}: <span className="line-through opacity-70">{shown(field, pair[0])}</span> → <span className="text-gray-200">{shown(field, pair[1])}</span>
          </li>
        ))}
      </ul>
    )
  }
  if (entry.action === 'paid') {
    return <div className="mt-1 text-gray-400">{formatMoney(d.amount)} · {methodLabel(d.method)}{Number(d.discount) > 0 ? ` · ${t('скидка')} ${formatMoney(d.discount)}` : ''}</div>
  }
  if (entry.action === 'reminded') {
    return <div className="mt-1 text-gray-400">{d.channel === 'email' ? 'Email' : 'Telegram'}</div>
  }
  if (entry.action === 'repeated') {
    return <div className="mt-1 text-gray-400">{(d.dates || []).map(formatShortDate).join(', ')}</div>
  }
  if (entry.action === 'service_added') {
    return <div className="mt-1 text-gray-400">{d.service}</div>
  }
  if (entry.action === 'created' && entry.actor === 'client') {
    return <div className="mt-1 text-gray-400">{t('Онлайн-запись')}</div>
  }
  return null
}

// История изменений записи: кто, когда и что поменял
export default function HistoryModal({ appointment: a, onClose }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAppointmentHistory(a.id).then(setItems).catch(err => setError(err.message))
  }, [a.id])

  return (
    <Modal title={t('История изменений')} onClose={onClose}>
      {error && <ErrorText>{error}</ErrorText>}
      {!items && !error && <Spinner />}
      {items && items.length === 0 && (
        <p className="text-gray-400 text-sm">{t('Изменений пока нет. История ведётся с ноября 2026 года.')}</p>
      )}
      {items && items.length > 0 && (
        <ol className="space-y-3 text-sm">
          {items.map(entry => (
            <li key={entry.id} className="rounded-xl px-3 py-2" style={{ backgroundColor: '#242424' }}>
              <div className="flex justify-between gap-3">
                <span className="text-white font-medium">{t(ACTIONS[entry.action] || entry.action)}</span>
                <span className="text-gray-500 text-xs whitespace-nowrap">{whenText(entry.at)}</span>
              </div>
              <div className="text-gray-500 text-xs">{who(entry)}</div>
              <Details entry={entry} />
            </li>
          ))}
        </ol>
      )}
    </Modal>
  )
}
