import { useCallback, useEffect, useState } from 'react'
import Modal from '../Modal'
import { Button, ErrorText } from '../ui'
import { fetchUnconfirmed, setVisitConfirmed } from '../../api/appointments'
import { notifyDataChanged, useAutoRefresh } from '../../utils/events'
import { formatDayTitle } from '../../utils/time'
import { t } from '../../../i18n'

// «Завтра не подтвердили»: кому из клиентов на завтра позвонить (вместо обзвона всех)
export default function UnconfirmedButton() {
  const [data, setData] = useState(null) // { date, appointments }
  const [open, setOpen] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    fetchUnconfirmed().then(setData).catch(() => {})
  }, [])
  useAutoRefresh(load)
  useEffect(() => { load() }, [load])

  async function confirm(id) {
    setBusyId(id)
    setError(null)
    try {
      await setVisitConfirmed(id, true)
      setData(d => d && { ...d, appointments: d.appointments.filter(a => a.id !== id) })
      notifyDataChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const list = data?.appointments || []
  if (!list.length && !open) return null

  return (
    <>
      <Button onClick={() => setOpen(true)} style={{ color: '#fbbf24' }}>
        ☎ {t('Завтра не подтвердили: {count}', { count: list.length })}
      </Button>
      {open && (
        <Modal title={t('Не подтвердили визит')} onClose={() => setOpen(false)}>
          <p className="text-gray-400 text-sm mb-1">{data && formatDayTitle(data.date)}</p>
          <p className="text-gray-500 text-xs mb-4">
            {t('Клиенты с Telegram получают напоминание с кнопкой «Приду». Здесь — те, кто ещё не ответил или без Telegram. Позвоните им и отметьте, если клиент подтвердил.')}
          </p>
          <ErrorText className="mb-3">{error}</ErrorText>
          {list.length === 0 && <p className="text-sm" style={{ color: '#34d399' }}>{t('Все клиенты на завтра подтвердили визит')}</p>}
          <ul className="space-y-2">
            {list.map(a => (
              <li key={a.id} className="rounded-xl p-3" style={{ backgroundColor: '#242424' }}>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-white font-semibold tabular-nums">{a.start_time}</span>
                  <span className="text-white min-w-0 break-words">{a.client_name}</span>
                  {a.master && <span className="text-gray-500 text-xs">· {a.master.name}</span>}
                </div>
                <div className="text-xs mt-1" style={{ color: a.reminder?.telegram ? '#9ca3af' : '#fbbf24' }}>
                  {a.reminder?.telegram ? t('Telegram: не ответил на напоминание') : t('Нет Telegram')}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  <a href={`tel:${a.client_phone}`} className="min-h-[44px] px-4 rounded-xl text-sm font-medium inline-flex items-center"
                    style={{ backgroundColor: '#2e2e2e', color: '#fff' }}>
                    ☎ {a.client_phone}
                  </a>
                  <Button variant="primary" disabled={busyId === a.id} onClick={() => confirm(a.id)}>{t('Подтвердил')}</Button>
                </div>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </>
  )
}
