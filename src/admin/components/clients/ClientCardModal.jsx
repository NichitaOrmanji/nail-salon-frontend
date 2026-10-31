import { useCallback, useEffect, useState } from 'react'
import { fetchClientCard, saveClientNote } from '../../api/clients'
import { cancelPenaltyPayment, forgivePenalty, payPenalty } from '../../api/penalties'
import { useStaffAuth } from '../../context/StaffAuthContext'
import { PENALTY_KIND, PENALTY_STATUS } from '../../utils/blacklist'
import { METHODS, formatMoney } from '../../utils/money'
import { clientDate } from '../../utils/time'
import Modal from '../Modal'
import StatusBadge from '../StatusBadge'
import { Button, ErrorText, Select, TextArea } from '../ui'
import Spinner from '../../../components/layout/Spinner'

function Stat({ label, value, color }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ backgroundColor: '#242424' }}>
      <div className="text-gray-500 text-[11px]">{label}</div>
      <div className="text-sm font-semibold break-words" style={{ color: color || '#ffffff' }}>{value}</div>
    </div>
  )
}

function NoteEditor({ phone, initial, onSaved }) {
  const [text, setText] = useState(initial)
  const [saved, setSaved] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const dirty = text.trim() !== saved

  async function handleSave() {
    setBusy(true)
    setError(null)
    try {
      const data = await saveClientNote(phone, text)
      setSaved(data.note)
      setText(data.note)
      onSaved?.(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="text-gray-400 text-xs font-medium mb-1.5">Заметка (видит только персонал)</div>
      <TextArea rows={3} value={text} maxLength={2000} onChange={e => setText(e.target.value)}
        placeholder="Аллергии, предпочтения, любимый дизайн..." />
      <ErrorText className="mt-1">{error}</ErrorText>
      {dirty && (
        <div className="flex justify-end mt-2">
          <Button variant="primary" disabled={busy} onClick={handleSave}>{busy ? 'Сохраняем...' : 'Сохранить заметку'}</Button>
        </div>
      )}
    </div>
  )
}

// Чёрный список: штрафы клиента и действия с ними (оплачен на месте / простить / отменить оплату)
function BlacklistSection({ card, onChanged }) {
  const { me } = useStaffAuth()
  const [method, setMethod] = useState('cash')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  if (!card.penalties?.length) return null
  const debt = Number(card.blacklist?.debt) || 0

  async function run(action) {
    setBusy(true)
    setError(null)
    try {
      await action()
      onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function forgive(p) {
    const note = window.prompt('Простить штраф? Причина (необязательно):', '')
    if (note === null) return
    run(() => forgivePenalty(p.id, note))
  }

  return (
    <div className="rounded-2xl p-3 space-y-2" style={{ backgroundColor: 'rgba(248, 113, 113, 0.08)', border: '1px solid #f87171' }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-sm" style={{ color: '#f87171' }}>
          {card.blacklist ? '⛔ Чёрный список' : 'Штрафы (все прощены)'}
        </span>
        {debt > 0 && <span className="text-sm" style={{ color: '#fca5a5' }}>Долг {formatMoney(debt)}</span>}
      </div>
      {debt > 0 && (
        <p className="text-xs text-gray-400">
          Оплачивается в салоне при следующем визите — в окне «Оплата» визита штраф добавится к счёту.
          Если клиент заплатил отдельно, отметьте ниже.
        </p>
      )}
      {card.penalties.map(p => (
        <div key={p.id} className="rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: '#1f1f1f' }}>
          <div className="flex flex-wrap justify-between gap-2">
            <span className="text-white">{clientDate(p.date)}, {p.time} · {PENALTY_KIND[p.kind]}</span>
            <span style={{ color: PENALTY_STATUS[p.status]?.color }}>{formatMoney(p.amount)} · {PENALTY_STATUS[p.status]?.label}</span>
          </div>
          {(p.service || p.note) && (
            <div className="text-xs text-gray-500 mt-0.5">{[p.service, p.note].filter(Boolean).join(' · ')}</div>
          )}
          {p.status === 'unpaid' && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Select value={method} onChange={e => setMethod(e.target.value)} aria-label="Способ оплаты штрафа" className="max-w-[140px]">
                {METHODS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
              </Select>
              <Button variant="primary" disabled={busy} onClick={() => run(() => payPenalty(p.id, method))}>Оплачен</Button>
              <Button disabled={busy} onClick={() => forgive(p)}>Простить</Button>
            </div>
          )}
          {p.status === 'paid' && me?.role === 'owner' && (
            <Button className="mt-2" disabled={busy}
              onClick={() => window.confirm('Отменить оплату штрафа? Приход уйдёт из кассы.') && run(() => cancelPenaltyPayment(p.id))}>
              Отменить оплату
            </Button>
          )}
        </div>
      ))}
      <ErrorText>{error}</ErrorText>
    </div>
  )
}

// Карточка клиента: статистика, заметка, история визитов в этом салоне
export default function ClientCardModal({ phone, onClose, onRebook }) {
  const [card, setCard] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    let alive = true
    fetchClientCard(phone)
      .then(data => { if (alive) setCard(data) })
      .catch(err => { if (alive) setError(err.message) })
    return () => { alive = false }
  }, [phone])

  useEffect(() => load(), [load])

  return (
    <Modal title={card?.name || 'Клиент'} onClose={onClose} maxWidth="sm:max-w-2xl">
      <ErrorText>{error}</ErrorText>
      {!card && !error && <Spinner />}
      {card && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <a href={`tel:${card.phone}`} className="text-sm font-medium" style={{ color: '#f472b6' }}>{card.phone}</a>
            <Button variant="primary" onClick={() => onRebook(card)}>Записать снова</Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Stat label="Визитов" value={card.visits} />
            <Stat label="Не пришёл" value={card.no_shows} color={card.no_shows ? '#f87171' : undefined} />
            <Stat label="Отменено" value={card.cancelled} />
            <Stat label="Оплачено" value={formatMoney(card.paid)} />
            <Stat label="Средний чек" value={card.average_check ? formatMoney(card.average_check) : '—'} />
            <Stat label="Следующая запись" value={card.next_visit ? clientDate(card.next_visit) : '—'} color={card.next_visit ? '#34d399' : undefined} />
            <Stat label="Последний визит" value={card.last_visit ? clientDate(card.last_visit) : '—'} />
            <Stat label="Любимый мастер" value={card.top_master || '—'} />
            <Stat label="Чаще всего" value={card.top_service || '—'} />
          </div>

          <BlacklistSection card={card} onChanged={load} />

          <NoteEditor phone={card.phone} initial={card.note} />

          <div>
            <div className="text-gray-400 text-xs font-medium mb-2">История ({card.total})</div>
            <div className="space-y-2">
              {card.appointments.map(a => (
                <div key={a.id} className="rounded-xl px-3 py-2" style={{ backgroundColor: '#242424' }}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-white text-sm font-medium">{clientDate(a.date)}, {a.start_time}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="text-gray-400 text-xs mt-1 break-words">
                    {a.service || 'Услуга не указана'}{a.master ? ` · ${a.master}` : ''}
                    {a.paid ? <span style={{ color: '#34d399' }}> · оплачено {formatMoney(a.paid)}</span> : ''}
                  </div>
                  {a.notes && <div className="text-gray-500 text-xs mt-1 whitespace-pre-line break-words">{a.notes}</div>}
                </div>
              ))}
            </div>
            {card.total > card.appointments.length && (
              <p className="text-gray-500 text-xs mt-2">Показаны последние {card.appointments.length} записей</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
