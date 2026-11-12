import { useState } from 'react'
import { Button, Select, TextArea } from '../../ui'
import { remindAppointment, setVisitConfirmed } from '../../../api/appointments'
import { visitStatus } from '../../../utils/visit'
import { notifyDataChanged } from '../../../utils/events'
import { formatShortDate } from '../../../utils/time'
import { formatDuration } from '../../../../utils/format'
import { t } from '../../../../i18n'
import { Section } from './ClientColumn'
import RepeatModal from './RepeatModal'
import HistoryModal from './HistoryModal'

const BUFFERS = [0, 5, 10, 15, 20, 30, 45, 60]

function MasterAvatar({ master }) {
  if (master?.photo) return <img src={master.photo} alt="" className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
  return (
    <span className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-semibold flex-shrink-0"
      style={{ backgroundColor: '#242424', color: '#d1d5db' }}>
      {(master?.name || '?').slice(0, 1).toUpperCase()}
    </span>
  )
}

function Tile({ title, subtitle, onClick, disabled, children }) {
  return (
    <div className="rounded-2xl p-3" style={{ backgroundColor: '#1f1f1f', border: '1px solid #2e2e2e' }}>
      <button type="button" onClick={onClick} disabled={disabled}
        className="w-full text-left min-h-[44px] disabled:opacity-50">
        <div className="text-white text-sm font-semibold">{title}</div>
        {subtitle && <div className="text-gray-500 text-xs mt-0.5">{subtitle}</div>}
      </button>
      {children}
    </div>
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

// Левая колонка: мастер, время, перерыв, комментарий, повтор, напоминание, история
export default function DetailsColumn({ a, master, isManager, canEdit, paid, busy, notes, setNotes, notesChanged, serverNotes, onPatch, onEdit }) {
  const [modal, setModal] = useState(null) // 'repeat' | 'history'
  const [remindState, setRemindState] = useState(null) // { ok, text }
  const [reminding, setReminding] = useState(false)

  async function remind() {
    setReminding(true)
    setRemindState(null)
    try {
      const data = await remindAppointment(a.id)
      setRemindState({ ok: true, text: t('Отправлено: {channel}', { channel: data.channel === 'email' ? 'Email' : 'Telegram' }) })
      notifyDataChanged()
    } catch (err) {
      setRemindState({ ok: false, text: err.message })
    } finally {
      setReminding(false)
    }
  }

  const upcoming = ['pending', 'confirmed'].includes(a.status)
  const visit = visitStatus(a)
  const [visitBusy, setVisitBusy] = useState(false)
  const [visitError, setVisitError] = useState(null)

  async function markVisit(confirmed) {
    setVisitBusy(true)
    setVisitError(null)
    try {
      await setVisitConfirmed(a.id, confirmed)
      notifyDataChanged()
    } catch (err) {
      setVisitError(err.message)
    } finally {
      setVisitBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <Section>
        <div className="flex items-center gap-3">
          <MasterAvatar master={master || a.master} />
          <div className="min-w-0">
            <div className="text-white font-semibold truncate">{a.master ? a.master.name : t('Без мастера')}</div>
            {a.master && a.master.is_active === false && <div className="text-gray-500 text-xs">{t('(скрыт)')}</div>}
            <div className="text-gray-400 text-sm">{formatShortDate(a.date)}, {a.start_time}–{a.end_time}</div>
            <div className="text-gray-500 text-xs">{formatDuration(a.duration)}</div>
          </div>
        </div>
        {isManager && !paid && (
          <Button className="w-full mt-3" disabled={busy} onClick={() => onEdit(a)}>{t('Перенести/изменить')}</Button>
        )}
        <label className="block mt-3">
          <span className="block text-gray-500 text-xs mb-1.5">{t('Технический перерыв после записи')}</span>
          <Select value={a.buffer_minutes || 0} disabled={!canEdit || busy}
            onChange={e => onPatch({ buffer_minutes: Number(e.target.value) })}>
            {BUFFERS.map(m => <option key={m} value={m}>{m ? t('{count} мин', { count: m }) : t('Без перерыва')}</option>)}
          </Select>
        </label>
      </Section>

      <Section title={t('Комментарий')}>
        <TextArea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('Заметка для персонала')} aria-label={t('Заметка')} />
        {notesChanged && (
          <div className="flex justify-end gap-2 mt-2">
            <Button onClick={() => setNotes(serverNotes)} disabled={busy}>{t('Отменить')}</Button>
            <Button variant="primary" onClick={() => onPatch({ notes })} disabled={busy}>{t('Сохранить')}</Button>
          </div>
        )}
      </Section>

      {isManager && (
        <Tile title={t('Повторение записи')} subtitle={t('Та же запись через неделю, две…')} onClick={() => setModal('repeat')} />
      )}
      {upcoming && (
        <div className="rounded-2xl p-3" style={{ backgroundColor: '#1f1f1f', border: '1px solid #2e2e2e' }}>
          <div className="text-white text-sm font-semibold">{t('Клиент придёт?')}</div>
          <div className="text-xs mt-0.5" style={{ color: visit.confirmed ? '#34d399' : '#fbbf24' }}>{visit.text}</div>
          {visit.hint && <div className="text-gray-500 text-xs mt-1">{visit.hint}</div>}
          {canEdit && (
            <Button className="w-full mt-2" disabled={visitBusy} onClick={() => markVisit(!visit.confirmed)}>
              {visit.confirmed ? t('Снять отметку') : t('Подтвердил по телефону')}
            </Button>
          )}
          {visitError && <p role="alert" className="text-xs mt-2" style={{ color: '#f87171' }}>{visitError}</p>}
        </div>
      )}
      <Tile title={t('Напоминание о визите')} subtitle={reminderText(a.reminder)}>
        {isManager && upcoming && (
          <div className="mt-1">
            <Button className="w-full" disabled={reminding} onClick={remind}>{reminding ? t('Отправляем...') : t('Напомнить сейчас')}</Button>
            {remindState && (
              <p role="status" className="text-xs mt-2" style={{ color: remindState.ok ? '#34d399' : '#f87171' }}>{remindState.text}</p>
            )}
          </div>
        )}
      </Tile>
      <Tile title={t('История изменений')} subtitle={t('Кто и что менял в записи')} onClick={() => setModal('history')} />

      {modal === 'repeat' && <RepeatModal appointment={a} onClose={() => setModal(null)} />}
      {modal === 'history' && <HistoryModal appointment={a} onClose={() => setModal(null)} />}
    </div>
  )
}
