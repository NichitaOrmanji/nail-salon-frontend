import { useState } from 'react'
import { Button, Select, TextArea } from '../../ui'
import { remindAppointment, setVisitConfirmed } from '../../../api/appointments'
import { notifyDataChanged } from '../../../utils/events'
import { formatShortDate } from '../../../utils/time'
import { ACTIVE_STATUSES } from '../../../utils/statuses'
import { visitStatus } from '../../../utils/visit'
import { formatDuration } from '../../../../utils/format'
import { t } from '../../../../i18n'
import { Section } from './ClientColumn'
import RepeatModal from './RepeatModal'
import HistoryModal from './HistoryModal'

// Блоки карточки записи: мастер и время, придёт ли клиент, комментарий, дополнительно

const BUFFERS = [0, 5, 10, 15, 20, 30, 45, 60]

function MasterAvatar({ master }) {
  if (master?.photo) return <img src={master.photo} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
  return (
    <span className="w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold flex-shrink-0"
      style={{ backgroundColor: 'var(--c-raised)', color: 'var(--c-ink-2)' }}>
      {(master?.name || '?').slice(0, 1).toUpperCase()}
    </span>
  )
}

// Мастер, дата и время, перенос и отмена, технический перерыв
export function BookingSection({ a, master, isManager, canEdit, paid, busy, onPatch, onEdit, onStatus }) {
  const active = ACTIVE_STATUSES.includes(a.status)
  return (
    <Section title={t('Мастер и время')}>
      <div className="flex items-center gap-3">
        <MasterAvatar master={master || a.master} />
        <div className="min-w-0">
          <div className="text-gray-500 text-xs">{t('Мастер')}</div>
          <div className="text-ink font-semibold break-words">
            {a.master ? a.master.name : t('Без мастера')}
            {a.master && a.master.is_active === false && <span className="text-gray-500 font-normal">{' '}{t('(скрыт)')}</span>}
          </div>
        </div>
      </div>
      <div className="mt-3 rounded-xl px-3 py-2.5" style={{ backgroundColor: 'var(--c-raised)' }}>
        <div className="text-ink text-sm font-medium">{formatShortDate(a.date)}</div>
        <div className="text-gray-400 text-sm">{a.start_time}–{a.end_time} · {formatDuration(a.duration)}</div>
      </div>
      {(isManager && !paid) || (active && !paid) ? (
        <div className="grid grid-cols-2 gap-2 mt-3">
          {isManager && !paid && <Button disabled={busy} onClick={() => onEdit(a)}>{t('Перенести')}</Button>}
          {active && !paid && (
            <Button disabled={busy} onClick={() => onStatus('cancelled')} style={{ color: 'var(--c-danger)' }}
              className={isManager ? '' : 'col-span-2'}>
              {t('Отменить запись')}
            </Button>
          )}
        </div>
      ) : null}
      <label className="block mt-3">
        <span className="block text-gray-500 text-xs mb-1.5">{t('Технический перерыв после записи')}</span>
        <Select value={a.buffer_minutes || 0} disabled={!canEdit || busy}
          onChange={e => onPatch({ buffer_minutes: Number(e.target.value) })}>
          {BUFFERS.map(m => <option key={m} value={m}>{m ? t('{count} мин', { count: m }) : t('Без перерыва')}</option>)}
        </Select>
      </label>
    </Section>
  )
}

function reminderText(r) {
  if (!r) return ''
  if (r.sent) return t('Напоминание уже отправлено')
  if (!r.telegram && !r.email) return t('Нет Telegram и email — только звонок')
  const channel = r.telegram ? 'Telegram' : 'Email'
  if (!r.minutes) return channel
  const value = r.minutes % 60 === 0 ? t('{count} ч', { count: r.minutes / 60 }) : t('{count} мин', { count: r.minutes })
  return t('{channel}, за {value} до визита', { channel, value })
}

// Придёт ли клиент: отметка (Telegram или звонок) и напоминание
export function VisitConfirmSection({ a, isManager, canMark }) {
  const visit = visitStatus(a)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [remindState, setRemindState] = useState(null) // { ok, text }

  async function mark(confirmed) {
    setBusy(true)
    setError(null)
    try {
      await setVisitConfirmed(a.id, confirmed)
      notifyDataChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function remind() {
    setBusy(true)
    setRemindState(null)
    try {
      const data = await remindAppointment(a.id)
      setRemindState({ ok: true, text: t('Отправлено: {channel}', { channel: data.channel === 'email' ? 'Email' : 'Telegram' }) })
      notifyDataChanged()
    } catch (err) {
      setRemindState({ ok: false, text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section title={t('Клиент придёт?')}>
      <div className="text-sm" style={{ color: visit.confirmed ? 'var(--c-ok)' : 'var(--c-warn)' }}>{visit.text}</div>
      {visit.hint && <div className="text-gray-500 text-xs mt-1">{visit.hint}</div>}
      {canMark && (
        <Button className="w-full mt-3" disabled={busy} onClick={() => mark(!visit.confirmed)}>
          {visit.confirmed ? t('Снять отметку') : t('Подтвердил по телефону')}
        </Button>
      )}
      {error && <p role="alert" className="text-xs mt-2" style={{ color: 'var(--c-danger)' }}>{error}</p>}
      <div className="mt-3 pt-3 flex flex-wrap items-center justify-between gap-2" style={{ borderTop: '1px solid var(--c-line)' }}>
        <div className="min-w-0">
          <div className="text-gray-500 text-xs">{t('Напоминание о визите')}</div>
          <div className="text-gray-300 text-sm">{reminderText(a.reminder)}</div>
        </div>
        {isManager && <Button disabled={busy} onClick={remind}>{t('Напомнить сейчас')}</Button>}
      </div>
      {remindState && (
        <p role="status" className="text-xs mt-2" style={{ color: remindState.ok ? 'var(--c-ok)' : 'var(--c-danger)' }}>{remindState.text}</p>
      )}
    </Section>
  )
}

// Комментарий к записи (для персонала)
export function CommentSection({ notes, setNotes, notesChanged, serverNotes, busy, onPatch }) {
  return (
    <Section title={t('Комментарий к записи')}>
      <TextArea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('Заметка для персонала')} aria-label={t('Заметка')} />
      {notesChanged && (
        <div className="flex justify-end gap-2 mt-2">
          <Button onClick={() => setNotes(serverNotes)} disabled={busy}>{t('Отменить')}</Button>
          <Button variant="primary" onClick={() => onPatch({ notes })} disabled={busy}>{t('Сохранить')}</Button>
        </div>
      )}
    </Section>
  )
}

function Row({ title, subtitle, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full min-h-[52px] flex items-center justify-between gap-3 text-left py-2"
      style={{ borderTop: '1px solid var(--c-line)' }}>
      <span className="min-w-0">
        <span className="block text-ink text-sm">{title}</span>
        {subtitle && <span className="block text-gray-500 text-xs">{subtitle}</span>}
      </span>
      <span className="text-gray-500" aria-hidden="true">›</span>
    </button>
  )
}

// Дополнительно: повтор, история, откуда запись
export function ExtrasSection({ a, isManager }) {
  const [modal, setModal] = useState(null) // 'repeat' | 'history'
  return (
    <Section title={t('Дополнительно')}>
      <div className="grid grid-cols-2 gap-3 mb-2">
        <div>
          <div className="text-gray-500 text-xs">{t('Создана')}</div>
          <div className="text-ink text-sm">{a.created_at ? formatShortDate(a.created_at.slice(0, 10)) : '—'}</div>
        </div>
        <div>
          <div className="text-gray-500 text-xs">{t('Источник')}</div>
          <div className="text-ink text-sm">{a.source === 'staff' ? t('Персонал') : t('Онлайн')}</div>
        </div>
      </div>
      {isManager && <Row title={t('Повторить запись')} subtitle={t('Та же запись через неделю, две…')} onClick={() => setModal('repeat')} />}
      <Row title={t('История изменений')} subtitle={t('Кто и что менял в записи')} onClick={() => setModal('history')} />
      {modal === 'repeat' && <RepeatModal appointment={a} onClose={() => setModal(null)} />}
      {modal === 'history' && <HistoryModal appointment={a} onClose={() => setModal(null)} />}
    </Section>
  )
}
