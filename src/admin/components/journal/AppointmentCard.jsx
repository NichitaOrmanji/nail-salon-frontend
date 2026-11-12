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
import { BookingSection, VisitConfirmSection, CommentSection, ExtrasSection } from './card/BookingSections'
import { StatusSection, ServicesSection } from './card/VisitColumn'
import ClientColumn from './card/ClientColumn'

// Карточка записи на весь экран рядом с боковой панелью (на телефоне — весь экран).
// Широкий экран — три колонки: слева мастер и время, придёт ли клиент, комментарий;
// в центре статус записи, услуги и оплата; справа клиент. На узком — одна колонка,
// сверху самое нужное: статус и оплата. Колонки на узком экране — display: contents,
// порядок блоков задаётся order.
// Заметка хранится локально — опрос журнала не сбрасывает её, пока не сохранили.
// hidden — карточка спрятана под открытой формой, но не размонтирована (ввод сохраняется).
// parts — все записи этого визита (несколько услуг подряд), masters — мастера журнала.
export default function AppointmentCard({ appointment: a, parts, masters = [], isManager, hidden = false, onDirtyChange, onClose, onEdit }) {
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

  // Карточка занимает всё справа от боковой панели: левый край — край основной области
  useLayoutEffect(() => {
    const panel = panelRef.current
    const main = document.querySelector('main')
    if (!panel || !main) return
    const update = () => {
      panel.style.setProperty('--card-left', `${Math.max(0, Math.round(main.getBoundingClientRect().left))}px`)
    }
    update()
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(update) : null
    observer?.observe(main)
    window.addEventListener('resize', update)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', update)
    }
  }, [hidden])

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

  const active = ['pending', 'confirmed'].includes(a.status)
  const column = 'contents xl:flex xl:flex-col xl:gap-4 xl:min-w-0'

  return (
    <div
      ref={panelRef}
      className={`fixed inset-0 md:left-[var(--card-left,0px)] z-40 flex-col ${hidden ? 'hidden' : 'flex'}`}
      style={{ backgroundColor: '#151515' }}
      role="dialog"
      aria-label={t('Карточка записи')}
    >
      <div className="flex items-center gap-3 pl-4 sm:pl-6 pr-2 py-2.5 flex-shrink-0" style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2e2e2e' }}>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-white text-lg font-semibold break-words">{a.client_name || t('Без имени')}</span>
            <StatusBadge status={a.status} />
          </div>
          <div className="text-gray-400 text-sm">
            {formatShortDate(a.date)}, {a.start_time}–{a.end_time}
            {a.master && <span className="text-gray-500"> · {t('Мастер')}: {a.master.name}</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={requestClose}
          aria-label={t('Закрыть')}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-400 active:scale-90 flex-shrink-0"
          style={{ backgroundColor: '#242424' }}
        >
          <IconClose />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6">
        <div className="max-w-3xl xl:max-w-none mx-auto flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,1fr)] xl:items-start">
          {/* Слева: мастер и время, придёт ли клиент, комментарий */}
          <div className={column}>
            <div className="order-4 xl:order-none">
              <BookingSection a={a} master={master} isManager={isManager} canEdit={canEdit} paid={paid} busy={busy}
                onPatch={patch} onEdit={onEdit} onStatus={changeStatus} />
            </div>
            {active && (
              <div className="order-3 xl:order-none">
                <VisitConfirmSection a={a} isManager={isManager} canMark={canEdit || !isManager} />
              </div>
            )}
            <div className="order-7 xl:order-none">
              <CommentSection notes={notes} setNotes={setNotes} notesChanged={notesChanged} serverNotes={serverNotes}
                busy={busy} onPatch={patch} />
            </div>
          </div>
          {/* В центре: статус, услуги и оплата, дополнительно */}
          <div className={column}>
            <div className="order-1 xl:order-none">
              <StatusSection a={a} busy={busy} paid={paid} error={error} onStatus={changeStatus} />
            </div>
            <div className="order-2 xl:order-none">
              <ServicesSection a={a} parts={visitParts} master={master} isManager={isManager} isOwner={isOwner} busy={busy}
                onPatch={patchPart} onPay={setCheckoutPart} onRemovePayment={removePayment} />
            </div>
            <div className="order-8 xl:order-none">
              <ExtrasSection a={a} isManager={isManager} />
            </div>
          </div>
          {/* Справа: клиент */}
          <div className="order-5 xl:order-none flex flex-col gap-4 min-w-0">
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
