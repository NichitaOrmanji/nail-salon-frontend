import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import StatusBadge from '../StatusBadge'
import { IconClose } from '../Icons'
import { updateAppointment } from '../../api/appointments'
import { cancelPayment } from '../../api/finance'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { formatMoney } from '../../utils/money'
import CheckoutModal from './CheckoutModal'
import ChoiceDialog from '../ChoiceDialog'
import { isLateCancel, penaltyAmount } from '../../utils/blacklist'
import { notifyDataChanged } from '../../utils/events'
import { formatShortDate } from '../../utils/time'
import { DISCARD_CONFIRM } from '../../utils/journal'
import { t } from '../../../i18n'
import DetailsColumn from './card/DetailsColumn'
import VisitColumn from './card/VisitColumn'
import ClientColumn from './card/ClientColumn'

// Карточка записи в три колонки (как в Altegio): слева — мастер, время, перерыв, комментарий,
// повтор, напоминание и история; в центре — статусы, услуги визита, цены и оплата;
// справа — клиент, связь, статистика. На узком экране колонки идут друг под другом.
// Боковая панель начинается под панелью дня; на телефоне — весь экран.
// Заметка хранится локально — опрос журнала не сбрасывает её, пока не сохранили.
// hidden — карточка спрятана под открытой формой, но не размонтирована (ввод сохраняется).
// parts — все записи этого визита (несколько услуг подряд), masters — мастера журнала.
export default function AppointmentCard({ appointment: a, parts, masters = [], isManager, hidden = false, topAnchorRef, onDirtyChange, onClose, onEdit }) {
  const serverNotes = a.notes || ''
  const [notes, setNotes] = useState(serverNotes)
  const [baseNotes, setBaseNotes] = useState(serverNotes)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [checkoutPart, setCheckoutPart] = useState(null)
  // Вопрос про чёрный список: 'no_show' | 'cancel' | null
  const [penaltyAsk, setPenaltyAsk] = useState(null)
  const panelRef = useRef(null)
  const { me } = useStaffAuth()
  const isOwner = me?.role === 'owner'
  const fee = penaltyAmount(a, me?.company)
  const master = a.master ? masters.find(m => m.id === a.master.id) || null : null
  const visitParts = parts && parts.length ? parts : [a]

  // Заметку изменили на сервере (форма, другой сотрудник): если своих правок нет — берём новую
  if (serverNotes !== baseNotes) {
    setBaseNotes(serverNotes)
    if (notes === baseNotes) setNotes(serverNotes)
  }

  const notesChanged = notes !== serverNotes
  const paid = !!a.payment
  const canEdit = isManager && !paid

  // Журнал знает, есть ли несохранённая заметка (переспросить при переходе к другой записи)
  useEffect(() => {
    onDirtyChange?.(notesChanged)
  }, [notesChanged, onDirtyChange])
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange])

  // Закрыть карточку; несохранённую заметку — только после подтверждения
  function requestClose() {
    if (notesChanged && !window.confirm(t(DISCARD_CONFIRM))) return
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

  async function run(action) {
    setError(null)
    setBusy(true)
    try {
      await action()
      notifyDataChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function patchPart(id, data, confirmText) {
    if (confirmText && !window.confirm(confirmText)) return
    run(() => updateAppointment(id, data))
  }

  const patch = (data, confirmText) => patchPart(a.id, data, confirmText)

  function removePayment(part) {
    if (!window.confirm(t('Отменить оплату? Сумма уйдёт из кассы и отчётов.'))) return
    run(() => cancelPayment(part.id))
  }

  function changeStatus(key) {
    if (key === 'no_show') {
      if (fee > 0) setPenaltyAsk('no_show')
      else patch({ status: 'no_show' })
    } else if (key === 'cancelled') {
      if (fee > 0 && isLateCancel(a, me?.company)) setPenaltyAsk('cancel')
      else patch({ status: 'cancelled' }, t('Отменить запись?'))
    } else if (key === 'confirmed' && a.status === 'completed') {
      patch({ status: 'confirmed' }, t('Вернуть запись в «Подтверждена»? Отметка «Пришёл» снимется.'))
    } else {
      patch({ status: key })
    }
  }

  return (
    <div
      ref={panelRef}
      className={`fixed inset-0 sm:left-auto sm:top-[var(--card-top,0px)] sm:w-[420px] xl:w-[min(1080px,calc(100vw-80px))] z-40 flex-col shadow-2xl ${hidden ? 'hidden' : 'flex'}`}
      style={{ backgroundColor: '#1a1a1a', borderLeft: '1px solid #2e2e2e' }}
      role="dialog"
      aria-label={t('Карточка записи')}
    >
      <div className="flex items-center gap-3 pl-5 pr-2 py-2 flex-shrink-0" style={{ borderBottom: '1px solid #2e2e2e' }}>
        <div className="flex-1 min-w-0">
          <div className="text-white text-base font-semibold truncate">{a.client_name || t('Без имени')}</div>
          <div className="text-gray-500 text-xs">{formatShortDate(a.date)}, {a.start_time}–{a.end_time}</div>
        </div>
        <StatusBadge status={a.status} />
        <button
          type="button"
          onClick={requestClose}
          aria-label={t('Закрыть')}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-400 active:scale-90"
        >
          <IconClose />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4">
        <div className="flex flex-col gap-3 xl:grid xl:grid-cols-[260px_minmax(0,1fr)_280px] xl:items-start">
          <div className="order-2 xl:order-1">
            <DetailsColumn a={a} master={master} isManager={isManager} canEdit={canEdit} paid={paid} busy={busy}
              notes={notes} setNotes={setNotes} notesChanged={notesChanged} serverNotes={serverNotes}
              onPatch={patch} onEdit={onEdit} />
          </div>
          <div className="order-1 xl:order-2">
            <VisitColumn a={a} parts={visitParts} master={master} isManager={isManager} isOwner={isOwner} busy={busy}
              error={error} onStatus={changeStatus} onPatch={patchPart} onPay={setCheckoutPart} onRemovePayment={removePayment} />
          </div>
          <div className="order-3">
            <ClientColumn a={a} isManager={isManager} canEdit={canEdit}
              onNavigateAway={e => { if (notesChanged && !window.confirm(t(DISCARD_CONFIRM))) e.preventDefault() }} />
          </div>
        </div>
      </div>

      {penaltyAsk === 'no_show' && (
        <ChoiceDialog
          title={t('Клиент не пришёл')}
          choices={[
            { value: 'penalty', label: t('В чёрный список, штраф {value}', { value: formatMoney(fee) }), variant: 'danger' },
            { value: 'skip', label: t('Без штрафа (уважительная причина)') },
          ]}
          onChoose={choice => {
            setPenaltyAsk(null)
            if (choice) patch({ status: 'no_show', penalty: choice === 'penalty' })
          }}
        >
          <p>{t('Штраф {penalty_percent}% стоимости услуги клиент оплатит в салоне при следующем визите.', { penalty_percent: me?.company?.penalty_percent })}</p>
        </ChoiceDialog>
      )}
      {penaltyAsk === 'cancel' && (
        <ChoiceDialog
          title={t('Отмена меньше чем за {late_cancel_hours} ч до визита', { late_cancel_hours: me?.company?.late_cancel_hours })}
          choices={[
            { value: 'penalty', label: t('Клиент отменил поздно — штраф {value}', { value: formatMoney(fee) }), variant: 'danger' },
            { value: 'skip', label: t('Отменить без штрафа (отменяет салон)') },
          ]}
          onChoose={choice => {
            setPenaltyAsk(null)
            if (choice) patch({ status: 'cancelled', penalty: choice === 'penalty' })
          }}
        >
          <p>{t('Если запись отменяет клиент, он попадёт в чёрный список и оплатит штраф при следующем визите.')}</p>
        </ChoiceDialog>
      )}
      {checkoutPart && (
        <CheckoutModal
          appointment={checkoutPart}
          onClose={() => setCheckoutPart(null)}
          onPaid={() => {
            setCheckoutPart(null)
            notifyDataChanged()
          }}
        />
      )}
    </div>
  )
}
