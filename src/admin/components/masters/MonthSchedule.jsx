import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchMasterDays, saveMasterDays } from '../../api/masters'
import { notifyDataChanged } from '../../utils/events'
import { dayHoursError, hoursLabel, lunchLabel } from '../../utils/schedule'
import { WEEKDAYS_SHORT, addDays, formatShortDate, todayString, weekdayIndex } from '../../utils/time'
import { Button, ErrorText } from '../ui'
import Spinner from '../../../components/layout/Spinner'
import TimeField from './TimeField'

// График мастера по датам: календарь месяца, выбор дней, свои часы и обед / выходной / как в шаблоне

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
// Вперёд — на год (как на сервере), назад — до текущего месяца
const MONTHS_AHEAD = 12

const MODES = [
  { key: 'custom', label: 'Рабочий день' },
  { key: 'off', label: 'Выходной' },
  { key: 'template', label: 'Как в шаблоне' },
]

const PINK = '#f472b6'

function monthStart(dateStr) {
  return `${dateStr.slice(0, 7)}-01`
}

function shiftMonth(first, delta) {
  const [y, m] = first.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function monthEnd(first) {
  const [y, m] = first.split('-').map(Number)
  return `${first.slice(0, 8)}${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
}

function monthDates(first) {
  const last = monthEnd(first)
  const dates = []
  for (let d = first; d <= last; d = addDays(d, 1)) dates.push(d)
  return dates
}

// '10:00' -> '10', '10:30' -> '10:30' (в ячейке мало места)
function short(time) {
  return time?.endsWith(':00') ? String(Number(time.slice(0, 2))) : time
}

function DayCell({ day, date, today, selected, readOnly, onToggle }) {
  const past = date < today
  const source = day?.source
  const working = day?.is_working
  const border = selected ? `2px solid ${PINK}` : source === 'custom' ? '1px solid #9d4b75' : '1px solid #2e2e2e'
  return (
    <button
      type="button"
      disabled={readOnly || past || !day}
      onClick={() => onToggle(date)}
      aria-pressed={selected}
      aria-label={formatShortDate(date)}
      className="relative rounded-xl p-1 text-left min-h-[64px] flex flex-col transition-all active:scale-95"
      style={{
        backgroundColor: selected ? '#3a2430' : working ? '#242424' : '#1a1a1a',
        border,
        opacity: past ? 0.4 : 1,
      }}
    >
      <span className="text-xs font-semibold" style={{ color: date === today ? PINK : '#d1d5db' }}>
        {Number(date.slice(8))}
      </span>
      {day && working && (
        <>
          <span className="text-[10px] leading-tight text-white">{short(day.start_time)}–{short(day.end_time)}</span>
          {day.break_start && (
            <span className="text-[10px] leading-tight" style={{ color: '#fbbf24' }}>
              обед {short(day.break_start)}
            </span>
          )}
        </>
      )}
      {day && !working && (
        <span className="text-[10px] leading-tight" style={{ color: source === 'off' ? '#f87171' : '#6b7280' }}>
          {source === 'off' ? 'выходной' : 'не работает'}
        </span>
      )}
      {day?.appointments > 0 && (
        <span className="absolute top-1 right-1 text-[9px] px-1 rounded" style={{ backgroundColor: '#2e2e2e', color: '#9ca3af' }}>
          {day.appointments}
        </span>
      )}
    </button>
  )
}

function Editor({ selection, days, onApply, onCancel, saving }) {
  // Начальные значения — из первого выбранного рабочего дня
  const sample = selection.map(d => days[d]).find(d => d?.is_working)
  const [mode, setMode] = useState('custom')
  const [hours, setHours] = useState({
    start_time: sample?.start_time || '09:00',
    end_time: sample?.end_time || '18:00',
    break_start: sample?.break_start || null,
    break_end: sample?.break_end || null,
  })
  const [error, setError] = useState(null)

  function set(patch) {
    setError(null)
    setHours(h => ({ ...h, ...patch }))
  }

  function apply() {
    if (mode === 'custom') {
      const message = dayHoursError(hours)
      if (message) {
        setError(message)
        return
      }
    }
    onApply(mode === 'custom' ? { mode, ...hours } : { mode })
  }

  return (
    <div className="rounded-2xl p-4 mt-4 space-y-3" style={{ backgroundColor: '#1f1f1f', border: `1px solid ${PINK}` }}>
      <div className="text-white text-sm font-semibold">
        Выбрано дней: {selection.length}
        {selection.length <= 3 && <span className="text-gray-400 font-normal"> ({selection.map(formatShortDate).join(', ')})</span>}
      </div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Что сделать с днями">
        {MODES.map(m => (
          <button
            key={m.key}
            type="button"
            role="radio"
            aria-checked={mode === m.key}
            onClick={() => { setMode(m.key); setError(null) }}
            className="px-3 min-h-[40px] rounded-xl text-sm"
            style={mode === m.key ? { backgroundColor: PINK, color: '#fff' } : { backgroundColor: '#242424', color: '#d1d5db' }}
          >
            {m.label}
          </button>
        ))}
      </div>
      {mode === 'custom' && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-400 text-sm w-16">Работа</span>
            <TimeField label="Начало работы" value={hours.start_time} onChange={v => set({ start_time: v })} />
            <span className="text-gray-500 text-xs">до</span>
            <TimeField label="Конец работы" value={hours.end_time} onChange={v => set({ end_time: v })} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-400 text-sm w-16">Обед</span>
            <TimeField label="Начало обеда" value={hours.break_start} onChange={v => set({ break_start: v })} />
            <span className="text-gray-500 text-xs">до</span>
            <TimeField label="Конец обеда" value={hours.break_end} clearable
              onChange={v => set(v ? { break_end: v } : { break_start: null, break_end: null })} />
          </div>
          <p className="text-gray-500 text-xs">Обед необязателен. В это время клиенты не смогут записаться.</p>
        </div>
      )}
      {mode === 'off' && <p className="text-gray-400 text-sm">Мастер не работает в эти дни, на сайте их не будет.</p>}
      {mode === 'template' && <p className="text-gray-400 text-sm">Убрать особые часы и выходные: дни станут как в недельном шаблоне.</p>}
      <ErrorText>{error}</ErrorText>
      <div className="flex flex-wrap justify-end gap-2">
        <Button onClick={onCancel} disabled={saving}>Снять выбор</Button>
        <Button variant="primary" onClick={apply} disabled={saving}>{saving ? 'Сохраняем...' : 'Применить'}</Button>
      </div>
    </div>
  )
}

export default function MonthSchedule({ masters, readOnly = false }) {
  const today = todayString()
  const firstMonth = monthStart(today)
  const lastMonth = shiftMonth(firstMonth, MONTHS_AHEAD)
  const activeMasters = masters.filter(m => m.is_active)
  const [masterId, setMasterId] = useState(activeMasters[0]?.id ?? null)
  const [month, setMonth] = useState(firstMonth)
  const [days, setDays] = useState(null) // { key, byDate }
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState([])
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null) // { conflicts, count }
  const requestRef = useRef(0)

  const key = `${masterId}:${month}`
  const load = useCallback(() => {
    if (!masterId) return Promise.resolve()
    const id = ++requestRef.current
    return fetchMasterDays(masterId, { dateFrom: month, dateTo: monthEnd(month) })
      .then(list => {
        if (id !== requestRef.current) return
        setDays({ key: `${masterId}:${month}`, byDate: Object.fromEntries(list.map(d => [d.date, d])) })
        setError(null)
      })
      .catch(err => { if (id === requestRef.current) setError(err.message) })
  }, [masterId, month])

  useEffect(() => {
    load()
  }, [load])

  const current = days?.key === key ? days.byDate : null
  const dates = useMemo(() => monthDates(month), [month])
  const leading = weekdayIndex(month)

  function changeMaster(id) {
    setMasterId(id)
    setSelected([])
    setResult(null)
  }

  function changeMonth(delta) {
    setMonth(m => shiftMonth(m, delta))
    setSelected([])
    setResult(null)
  }

  function toggle(date) {
    setResult(null)
    setSelected(list => (list.includes(date) ? list.filter(d => d !== date) : [...list, date].sort()))
  }

  function selectWhere(test) {
    setResult(null)
    setSelected(dates.filter(d => d >= today && test(weekdayIndex(d))))
  }

  async function apply(body) {
    setSaving(true)
    setError(null)
    try {
      const response = await saveMasterDays(masterId, { dates: selected, ...body })
      setDays(prev => ({
        key,
        byDate: { ...(prev?.key === key ? prev.byDate : {}), ...Object.fromEntries(response.days.map(d => [d.date, d])) },
      }))
      setResult({ conflicts: response.conflicts || [], count: selected.length })
      setSelected([])
      notifyDataChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!activeMasters.length) return <p className="text-gray-500 text-sm">Активных мастеров нет</p>
  const master = activeMasters.find(m => m.id === masterId)

  return (
    <div>
      {!readOnly && activeMasters.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4" role="radiogroup" aria-label="Мастер">
          {activeMasters.map(m => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={m.id === masterId}
              onClick={() => changeMaster(m.id)}
              className="px-3 min-h-[40px] rounded-xl text-sm font-medium"
              style={m.id === masterId ? { backgroundColor: PINK, color: '#fff' } : { backgroundColor: '#242424', color: '#d1d5db' }}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <Button onClick={() => changeMonth(-1)} disabled={month <= firstMonth} aria-label="Предыдущий месяц">‹</Button>
        <div className="text-white text-base font-semibold">
          {MONTHS[Number(month.slice(5, 7)) - 1]} {month.slice(0, 4)}
          {master && !readOnly && <span className="text-gray-500 text-sm font-normal"> · {master.name}</span>}
        </div>
        <Button onClick={() => changeMonth(1)} disabled={month >= lastMonth} aria-label="Следующий месяц">›</Button>
      </div>

      {!readOnly && (
        <div className="flex flex-wrap gap-2 mb-3">
          <Button onClick={() => selectWhere(() => true)}>Весь месяц</Button>
          <Button onClick={() => selectWhere(d => d < 5)}>Будни</Button>
          <Button onClick={() => selectWhere(d => d >= 5)}>Сб и Вс</Button>
        </div>
      )}

      <ErrorText className="mb-3">{error}</ErrorText>
      {!current && !error && <Spinner />}
      {current && (
        <>
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS_SHORT.map(d => <div key={d} className="text-center text-gray-500 text-xs py-1">{d}</div>)}
            {Array.from({ length: leading }, (_, i) => <div key={`e${i}`} />)}
            {dates.map(date => (
              <DayCell key={date} date={date} day={current[date]} today={today} readOnly={readOnly}
                selected={selected.includes(date)} onToggle={toggle} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
            <span><span style={{ color: '#9d4b75' }}>▢</span> свои часы на дату</span>
            <span><span style={{ color: '#f87171' }}>выходной</span> — по дате</span>
            <span><span style={{ color: '#fbbf24' }}>обед</span> — начало обеда</span>
            <span>цифра в углу — записи</span>
          </div>
          {!readOnly && !selected.length && !result && (
            <p className="text-gray-500 text-xs mt-3">Нажмите на дни, чтобы задать часы работы, обед или выходной.</p>
          )}
        </>
      )}

      {selected.length > 0 && current && (
        <Editor key={selected.join()} selection={selected} days={current} saving={saving}
          onApply={apply} onCancel={() => setSelected([])} />
      )}

      {result && (
        <div className="mt-4 space-y-2">
          <p className="text-xs" style={{ color: '#34d399' }}>Сохранено дней: {result.count}</p>
          {result.conflicts.length > 0 && (
            <div className="text-sm rounded-xl px-3 py-2" style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
              Записи вне нового графика — перенесите или отмените их в журнале:
              <ul className="mt-1 space-y-0.5">
                {result.conflicts.map(c => (
                  <li key={c.id}>
                    {formatShortDate(c.date)}, {c.start_time}–{c.end_time} · {c.client_name} ({c.reason})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {readOnly && current && (
        <div className="mt-4 space-y-1">
          {dates.filter(d => d >= today && current[d]?.is_working).slice(0, 7).map(d => (
            <div key={d} className="text-sm text-gray-300">
              {formatShortDate(d)}: {hoursLabel(current[d])}
              {lunchLabel(current[d]) && <span className="text-gray-500"> · обед {lunchLabel(current[d])}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
