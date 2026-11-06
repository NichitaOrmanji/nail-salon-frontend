import { useState } from 'react'
import Modal from '../../Modal'
import { Button, ErrorText, Field, Select } from '../../ui'
import { repeatAppointment } from '../../../api/appointments'
import { notifyDataChanged } from '../../../utils/events'
import { formatShortDate } from '../../../utils/time'
import { t } from '../../../../i18n'

const EVERY = [
  { days: 7, label: 'Каждую неделю' },
  { days: 14, label: 'Каждые 2 недели' },
  { days: 21, label: 'Каждые 3 недели' },
  { days: 28, label: 'Каждые 4 недели' },
]
const COUNTS = Array.from({ length: 12 }, (_, i) => i + 1)

// Повторение записи: тот же клиент, мастер, услуга и время на следующие даты
export default function RepeatModal({ appointment: a, onClose }) {
  const [everyDays, setEveryDays] = useState(7)
  const [count, setCount] = useState(4)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const data = await repeatAppointment(a.id, { everyDays, count })
      setResult(data)
      if (data.created?.length) notifyDataChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={t('Повторение записи')} onClose={onClose}>
      {result ? (
        <div className="space-y-3 text-sm">
          {result.created.length > 0 && (
            <div>
              <div className="text-white font-semibold mb-1">{t('Создано записей: {count}', { count: result.created.length })}</div>
              <ul className="text-gray-300 space-y-0.5">
                {result.created.map(c => <li key={c.id}>{formatShortDate(c.date)}, {c.start_time}</li>)}
              </ul>
            </div>
          )}
          {result.skipped.length > 0 && (
            <div>
              <div className="font-semibold mb-1" style={{ color: '#fbbf24' }}>{t('Пропущено — время занято')}</div>
              <ul className="text-gray-400 space-y-0.5">
                {result.skipped.map(s => <li key={s.date}>{formatShortDate(s.date)} — {s.reason}</li>)}
              </ul>
            </div>
          )}
          <div className="flex justify-end"><Button variant="primary" onClick={onClose}>{t('Готово')}</Button></div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-gray-400 text-sm">
            {t('Тот же клиент, мастер, услуга и время: {time}.', { time: `${a.start_time}–${a.end_time}` })}
          </p>
          <Field label={t('Как часто')}>
            <Select value={everyDays} onChange={e => setEveryDays(Number(e.target.value))}>
              {EVERY.map(o => <option key={o.days} value={o.days}>{t(o.label)}</option>)}
            </Select>
          </Field>
          <Field label={t('Сколько раз')}>
            <Select value={count} onChange={e => setCount(Number(e.target.value))}>
              {COUNTS.map(n => <option key={n} value={n}>{n}</option>)}
            </Select>
          </Field>
          {error && <ErrorText>{error}</ErrorText>}
          <div className="flex justify-end gap-2">
            <Button onClick={onClose}>{t('Отмена')}</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? t('Сохраняем...') : t('Повторить')}</Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
