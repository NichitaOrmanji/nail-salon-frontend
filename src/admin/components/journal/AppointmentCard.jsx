import { useState, useEffect, useRef } from 'react'
import { Button, ErrorText, TextArea } from '../ui'
import StatusBadge from '../StatusBadge'
import { IconClose } from '../Icons'
import { updateAppointment } from '../../api/appointments'
import { notifyDataChanged } from '../../utils/events'
import { formatShortDate, todayString } from '../../utils/time'
import { ACTIVE_STATUSES } from '../../utils/statuses'
import { formatDuration, formatPrice } from '../../../utils/format'

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-3" style={{ borderBottom: '1px solid #2e2e2e' }}>
      <span className="text-gray-500 text-sm flex-shrink-0">{label}</span>
      <span className="text-white text-sm text-right min-w-0 break-words">{children}</span>
    </div>
  )
}

// Карточка записи: боковая панель (≥ 640px) или весь экран (< 640px).
// Заметка хранится локально — опрос журнала не сбрасывает её, пока не сохранили.
export default function AppointmentCard({ appointment: a, isManager, onClose, onEdit }) {
  const [notes, setNotes] = useState(a.notes || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onCloseRef.current?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const notesChanged = notes !== (a.notes || '')
  const isActive = ACTIVE_STATUSES.includes(a.status)
  const canMarkVisit = isActive && a.date <= todayString()

  async function patch(data, confirmText) {
    if (confirmText && !window.confirm(confirmText)) return
    setError(null)
    setBusy(true)
    try {
      await updateAppointment(a.id, data)
      notifyDataChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[400px] z-40 flex flex-col shadow-2xl"
      style={{ backgroundColor: '#1a1a1a', borderLeft: '1px solid #2e2e2e' }}
      role="dialog"
      aria-label="Карточка записи"
    >
      <div className="flex items-center gap-3 pl-5 pr-2 py-2 flex-shrink-0" style={{ borderBottom: '1px solid #2e2e2e' }}>
        <div className="flex-1 min-w-0">
          <div className="text-white text-base font-semibold truncate">{a.client_name || 'Без имени'}</div>
          <div className="text-gray-500 text-xs">{formatShortDate(a.date)}, {a.start_time}–{a.end_time}</div>
        </div>
        <StatusBadge status={a.status} />
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-400 active:scale-90"
        >
          <IconClose />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-2">
        <Row label="Телефон">
          {a.client_phone
            ? <a href={`tel:${a.client_phone}`} style={{ color: '#f472b6' }}>{a.client_phone}</a>
            : '—'}
        </Row>
        {a.client_email && <Row label="Email">{a.client_email}</Row>}
        <Row label="Услуга">
          {a.service ? a.service.name : 'Не указана'}
          {a.service && a.service.is_active === false && <span className="text-gray-500"> (скрыта)</span>}
        </Row>
        <Row label="Мастер">
          {a.master ? a.master.name : 'Без мастера'}
          {a.master && a.master.is_active === false && <span className="text-gray-500"> (скрыт)</span>}
        </Row>
        <Row label="Дата и время">{formatShortDate(a.date)}, {a.start_time}–{a.end_time}</Row>
        <Row label="Длительность">{formatDuration(a.duration)}</Row>
        <Row label="Цена">{a.service ? formatPrice(a.service.price) : '—'}</Row>
        <Row label="Источник">{a.source === 'staff' ? 'Персонал' : 'Онлайн'}</Row>
        <Row label="Статус"><StatusBadge status={a.status} /></Row>

        <div className="py-3">
          <div className="text-gray-500 text-sm mb-2">Заметка</div>
          <TextArea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Заметка для персонала" />
          {notesChanged && (
            <div className="flex justify-end gap-2 mt-2">
              <Button onClick={() => setNotes(a.notes || '')} disabled={busy}>Отменить</Button>
              <Button variant="primary" onClick={() => patch({ notes })} disabled={busy}>Сохранить</Button>
            </div>
          )}
        </div>

        <ErrorText className="mb-3">{error}</ErrorText>
      </div>

      <div className="flex-shrink-0 px-5 py-3 flex flex-wrap gap-2" style={{ borderTop: '1px solid #2e2e2e' }}>
        {a.status === 'pending' && (
          <Button variant="primary" disabled={busy} onClick={() => patch({ status: 'confirmed' })}>Подтвердить</Button>
        )}
        {canMarkVisit && (
          <>
            <Button disabled={busy} style={{ color: '#60a5fa' }} onClick={() => patch({ status: 'completed' })}>Пришёл</Button>
            <Button disabled={busy} style={{ color: '#f87171' }} onClick={() => patch({ status: 'no_show' })}>Не пришёл</Button>
          </>
        )}
        {isActive && (
          <Button variant="danger" disabled={busy} onClick={() => patch({ status: 'cancelled' }, 'Отменить запись?')}>Отменить</Button>
        )}
        {(a.status === 'cancelled' || a.status === 'no_show') && (
          <Button disabled={busy} onClick={() => patch({ status: 'confirmed' })}>Вернуть</Button>
        )}
        {isManager && (
          <Button disabled={busy} onClick={() => onEdit(a)}>Перенести/изменить</Button>
        )}
      </div>
    </div>
  )
}
