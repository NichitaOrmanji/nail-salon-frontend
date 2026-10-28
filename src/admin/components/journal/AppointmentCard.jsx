import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Button, TextArea } from '../ui'
import StatusBadge from '../StatusBadge'
import { IconClose } from '../Icons'
import { updateAppointment } from '../../api/appointments'
import { cancelPayment } from '../../api/finance'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { formatMoney, methodLabel } from '../../utils/money'
import CheckoutModal from './CheckoutModal'
import { notifyDataChanged } from '../../utils/events'
import { formatShortDate, todayString } from '../../utils/time'
import { ACTIVE_STATUSES } from '../../utils/statuses'
import { DISCARD_CONFIRM } from '../../utils/journal'
import { formatDuration, formatPrice } from '../../../utils/format'

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-3" style={{ borderBottom: '1px solid #2e2e2e' }}>
      <span className="text-gray-500 text-sm flex-shrink-0">{label}</span>
      <span className="text-white text-sm text-right min-w-0 break-words">{children}</span>
    </div>
  )
}

// Карточка записи: боковая панель (≥ 640px, под панелью дня — шапка с «Новые: N»
// и «+ Запись» остаются доступны) или весь экран (< 640px).
// Заметка хранится локально — опрос журнала не сбрасывает её, пока не сохранили.
// hidden — карточка спрятана под открытой формой, но не размонтирована (ввод сохраняется).
// topAnchorRef — элемент, под которым начинается боковая панель.
export default function AppointmentCard({ appointment: a, isManager, hidden = false, topAnchorRef, onDirtyChange, onClose, onEdit }) {
  const serverNotes = a.notes || ''
  const [notes, setNotes] = useState(serverNotes)
  const [baseNotes, setBaseNotes] = useState(serverNotes)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const panelRef = useRef(null)
  const { me } = useStaffAuth()
  const isOwner = me?.role === 'owner'

  // Заметку изменили на сервере (форма, другой сотрудник): если своих правок нет — берём новую
  if (serverNotes !== baseNotes) {
    setBaseNotes(serverNotes)
    if (notes === baseNotes) setNotes(serverNotes)
  }

  const notesChanged = notes !== serverNotes
  const isActive = ACTIVE_STATUSES.includes(a.status)
  const canMarkVisit = isActive && a.date <= todayString()
  // Оплаченный визит заблокирован: менять его можно после отмены оплаты (владельцем)
  const paid = !!a.payment
  const canRestore = !paid && (a.status === 'cancelled' || a.status === 'no_show' || a.status === 'completed')
  const canPay = isManager && !paid && (isActive || a.status === 'completed') && a.date <= todayString()
  const hasActions = isActive || canRestore || isManager

  // Журнал знает, есть ли несохранённая заметка (переспросить при переходе к другой записи)
  useEffect(() => {
    onDirtyChange?.(notesChanged)
  }, [notesChanged, onDirtyChange])
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange])

  // Закрыть карточку; несохранённую заметку — только после подтверждения
  function requestClose() {
    if (notesChanged && !window.confirm(DISCARD_CONFIRM)) return
    onClose()
  }

  const requestCloseRef = useRef(requestClose)
  useEffect(() => {
    requestCloseRef.current = requestClose
  })
  useEffect(() => {
    if (hidden) return
    const onKey = e => {
      if (e.key !== 'Escape') return
      // Поверх карточки открыто модальное окно — Escape относится к нему
      if (document.querySelector('[aria-modal="true"]')) return
      requestCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hidden])

  // Боковая панель начинается под панелью дня (её высота меняется при переносе строк)
  useLayoutEffect(() => {
    const anchor = topAnchorRef?.current
    const panel = panelRef.current
    if (!anchor || !panel) return
    const update = () => {
      panel.style.setProperty('--card-top', `${Math.max(0, Math.round(anchor.getBoundingClientRect().bottom))}px`)
    }
    update()
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null
    observer?.observe(anchor)
    window.addEventListener('resize', update)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [topAnchorRef, hidden])

  async function removePayment() {
    if (!window.confirm('Отменить оплату? Сумма уйдёт из кассы и отчётов.')) return
    setError(null)
    setBusy(true)
    try {
      await cancelPayment(a.id)
      notifyDataChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

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
      ref={panelRef}
      className={`fixed inset-0 sm:left-auto sm:top-[var(--card-top,0px)] sm:w-[360px] lg:w-[400px] z-40 flex-col shadow-2xl ${hidden ? 'hidden' : 'flex'}`}
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
          onClick={requestClose}
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
          {isManager && a.client_phone && (
            <Link
              to="/admin-panel/clients"
              state={{ phone: a.client_phone }}
              onClick={e => { if (notes !== baseNotes && !window.confirm(DISCARD_CONFIRM)) e.preventDefault() }}
              className="ml-3 text-xs text-gray-400 underline"
            >
              Карточка клиента
            </Link>
          )}
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
        <Row label="Оплата">
          {paid ? (
            <span style={{ color: '#34d399' }}>
              {formatMoney(a.payment.amount)} · {methodLabel(a.payment.method)}
              {Number(a.payment.discount) > 0 && <span className="text-gray-500"> (скидка {formatMoney(a.payment.discount)})</span>}
            </span>
          ) : <span className="text-gray-500">не оплачено</span>}
        </Row>
        <Row label="Источник">{a.source === 'staff' ? 'Персонал' : 'Онлайн'}</Row>
        <Row label="Статус"><StatusBadge status={a.status} /></Row>

        <div className="py-3">
          <div className="text-gray-500 text-sm mb-2">Заметка</div>
          <TextArea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Заметка для персонала" aria-label="Заметка" />
          {notesChanged && (
            <div className="flex justify-end gap-2 mt-2">
              <Button onClick={() => setNotes(serverNotes)} disabled={busy}>Отменить</Button>
              <Button variant="primary" onClick={() => patch({ notes })} disabled={busy}>Сохранить</Button>
            </div>
          )}
        </div>
      </div>

      {/* Низ закреплён: ошибка действия видна над кнопками даже на маленьком экране.
          Нет ни кнопок, ни ошибки — пустую полосу не показываем */}
      {(hasActions || error) && (
        <div className="flex-shrink-0 px-5 py-3 flex flex-wrap gap-2" style={{ borderTop: '1px solid #2e2e2e' }}>
          {error && <p role="alert" className="basis-full text-red-400 text-sm">{error}</p>}
          {canPay && (
            <Button variant="primary" disabled={busy} onClick={() => setCheckoutOpen(true)}>Оплата</Button>
          )}
          {paid && isOwner && (
            <Button disabled={busy} onClick={removePayment}>Отменить оплату</Button>
          )}
          {a.status === 'pending' && (
            <Button variant={canPay ? 'secondary' : 'primary'} disabled={busy} onClick={() => patch({ status: 'confirmed' })}>Подтвердить</Button>
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
          {canRestore && (
            <Button
              disabled={busy}
              onClick={() => patch(
                { status: 'confirmed' },
                a.status === 'completed' ? 'Вернуть запись в «Подтверждена»? Отметка «Пришёл» снимется.' : undefined
              )}
            >
              Вернуть
            </Button>
          )}
          {isManager && !paid && (
            <Button disabled={busy} onClick={() => onEdit(a)}>Перенести/изменить</Button>
          )}
        </div>
      )}
      {checkoutOpen && (
        <CheckoutModal
          appointment={a}
          onClose={() => setCheckoutOpen(false)}
          onPaid={() => {
            setCheckoutOpen(false)
            notifyDataChanged()
          }}
        />
      )}
    </div>
  )
}
