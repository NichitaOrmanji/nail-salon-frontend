import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchRecentOnline } from '../api/appointments'
import { notifyDataChanged, useAutoRefresh } from '../utils/events'
import { t, tr } from '../../i18n'

const SHOW_MS = 20000
const MAX_TOASTS = 3
const MONTHS = tr(['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'])

function when(a) {
  const [, m, d] = a.date.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]}, ${a.start_time}`
}

// Всплывающие «Новая онлайн-запись» в углу панели: опрос раз в 30 секунд
export default function OnlineToasts() {
  const navigate = useNavigate()
  const [toasts, setToasts] = useState([])
  const sinceRef = useRef(new Date().toISOString())
  const seenRef = useRef(new Set())

  const dismiss = useCallback(id => setToasts(list => list.filter(item => item.id !== id)), [])

  const poll = useCallback(() => {
    fetchRecentOnline(sinceRef.current)
      .then(({ now, items }) => {
        sinceRef.current = now
        const fresh = items.filter(a => !seenRef.current.has(a.id))
        if (!fresh.length) return
        fresh.forEach(a => {
          seenRef.current.add(a.id)
          setTimeout(() => dismiss(a.id), SHOW_MS)
        })
        setToasts(list => [...fresh, ...list].slice(0, MAX_TOASTS))
        notifyDataChanged()
      })
      .catch(() => {}) // уведомления необязательные — журнал обновится сам
  }, [dismiss])

  useAutoRefresh(poll, 30000)

  if (!toasts.length) return null
  return (
    <div className="fixed z-40 bottom-4 right-4 left-4 sm:left-auto sm:w-80 space-y-2" aria-live="polite">
      {toasts.map(a => (
        <div key={a.id} role="status" className="rounded-2xl p-4 shadow-xl" style={{ backgroundColor: 'var(--c-raised)', border: '1px solid var(--c-line-2)' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold mb-1" style={{ color: 'var(--accent-ink)' }}>{t('Новая онлайн-запись')}</div>
              <div className="text-ink text-sm font-medium truncate">{a.client_name}</div>
              <div className="text-gray-400 text-xs mt-0.5 truncate">
                {[a.service?.name, a.master?.name].filter(Boolean).join(' · ')}
              </div>
              <div className="text-gray-400 text-xs">{when(a)}</div>
            </div>
            <button type="button" aria-label={t('Скрыть')} onClick={() => dismiss(a.id)} className="text-gray-500 text-lg leading-none px-1">×</button>
          </div>
          <button
            type="button"
            onClick={() => { dismiss(a.id); navigate(`/admin-panel?view=day&date=${a.date}&open=${a.id}`) }}
            className="mt-3 w-full min-h-[36px] rounded-xl text-sm font-medium text-white"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {t('Открыть запись')}
          </button>
        </div>
      ))}
    </div>
  )
}
