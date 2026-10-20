import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from './Modal'
import { Button, ErrorText } from './ui'
import Spinner from '../../components/layout/Spinner'
import { fetchPendingAppointments, updateAppointment, MAX_PENDING_ITEMS } from '../api/appointments'
import { notifyDataChanged, useAutoRefresh } from '../utils/events'
import { formatShortDate } from '../utils/time'

// Новые (ожидающие подтверждения) записи — все будущие, как в бейдже «Новые: N»
export default function NewAppointmentsModal({ onClose }) {
  const navigate = useNavigate()
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(() => {
    return fetchPendingAppointments()
      .then(data => { setItems(data); setError(null) })
      .catch(err => setError(err.message))
  }, [])

  useEffect(() => {
    load()
  }, [load])
  useAutoRefresh(load)

  async function setStatus(a, status) {
    if (status === 'cancelled' && !window.confirm(`Отменить запись ${a.client_name} на ${formatShortDate(a.date)}, ${a.start_time}?`)) return
    setActionError(null)
    setBusyId(a.id)
    try {
      await updateAppointment(a.id, { status })
      notifyDataChanged()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  function openInJournal(a) {
    onClose()
    navigate(`/admin-panel?date=${a.date}&open=${a.id}`)
  }

  return (
    <Modal title="Новые записи" onClose={onClose} maxWidth="sm:max-w-2xl">
      {items === null && !error && <Spinner />}
      <ErrorText className="mb-3">{error || actionError}</ErrorText>
      {items && items.length === 0 && (
        <p className="text-gray-500 text-sm text-center py-10">Новых записей нет</p>
      )}
      {items && items.length > 0 && (
        <div className="space-y-3">
          {items.length >= MAX_PENDING_ITEMS && (
            <p className="text-gray-500 text-xs">Показаны первые {MAX_PENDING_ITEMS} записей — подтвердите их, чтобы увидеть остальные</p>
          )}
          {items.map(a => (
            <div key={a.id} className="rounded-2xl p-4" style={{ backgroundColor: '#242424' }}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <div className="text-white text-sm font-semibold">
                  {formatShortDate(a.date)}, {a.start_time}–{a.end_time}
                </div>
                <div className="text-gray-400 text-xs">{a.master?.name || 'Без мастера'}</div>
              </div>
              <div className="text-gray-300 text-sm mt-1 break-words">{a.service?.name || 'Услуга не указана'}</div>
              <div className="text-sm mt-1 break-words">
                <span className="text-white">{a.client_name}</span>
                {a.client_phone && (
                  <>
                    <span className="text-gray-600"> · </span>
                    <a href={`tel:${a.client_phone}`} style={{ color: '#f472b6' }}>{a.client_phone}</a>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button variant="primary" disabled={busyId === a.id} onClick={() => setStatus(a, 'confirmed')}>Подтвердить</Button>
                <Button variant="danger" disabled={busyId === a.id} onClick={() => setStatus(a, 'cancelled')}>Отменить</Button>
                <Button onClick={() => openInJournal(a)}>Открыть в журнале</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
