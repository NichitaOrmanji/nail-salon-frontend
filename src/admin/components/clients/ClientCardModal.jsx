import { useEffect, useState } from 'react'
import { fetchClientCard, saveClientNote } from '../../api/clients'
import { formatMoney } from '../../utils/money'
import { clientDate } from '../../utils/time'
import Modal from '../Modal'
import StatusBadge from '../StatusBadge'
import { Button, ErrorText, TextArea } from '../ui'
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

// Карточка клиента: статистика, заметка, история визитов в этом салоне
export default function ClientCardModal({ phone, onClose, onRebook }) {
  const [card, setCard] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    fetchClientCard(phone)
      .then(data => { if (alive) setCard(data) })
      .catch(err => { if (alive) setError(err.message) })
    return () => { alive = false }
  }, [phone])

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
