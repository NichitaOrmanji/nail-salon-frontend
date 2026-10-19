import { useState, useEffect, useCallback } from 'react'
import { saveSchedule, fetchDaysOff, addDayOff, removeDayOff, setMasterAccess, revokeMasterAccess } from '../../api/masters'
import { notifyDataChanged } from '../../utils/events'
import { WEEKDAYS_SHORT, todayString, addDays, formatShortDate, timeToMin } from '../../utils/time'
import { Button, Checkbox, ErrorText, Field, TextInput, WarningText } from '../ui'

// Разделы карточки мастера: график, выходные по датам, доступ в панель

export function Section({ title, children }) {
  return (
    <section className="rounded-2xl p-4" style={{ backgroundColor: '#1f1f1f', border: '1px solid #2e2e2e' }}>
      <h3 className="text-white text-sm font-semibold mb-3">{title}</h3>
      {children}
    </section>
  )
}

// Ровно 7 дней Пн..Вс; отсутствующие — нерабочие 09:00–18:00
function normalizeSchedule(schedule) {
  return WEEKDAYS_SHORT.map((_, day) => {
    const found = Array.isArray(schedule) ? schedule.find(s => s.day_of_week === day) : null
    return {
      day_of_week: day,
      is_working: !!found?.is_working,
      start_time: found?.start_time || '09:00',
      end_time: found?.end_time || '18:00',
    }
  })
}

const timeInputStyle = { backgroundColor: '#242424', border: '1px solid #2e2e2e', colorScheme: 'dark' }

export function ScheduleSection({ master, readOnly, onSaved }) {
  const [rows, setRows] = useState(() => normalizeSchedule(master.schedule))
  const [saved, setSaved] = useState(() => JSON.stringify(normalizeSchedule(master.schedule)))
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const changed = JSON.stringify(rows) !== saved

  function update(day, patch) {
    setDone(false)
    setRows(list => list.map(r => (r.day_of_week === day ? { ...r, ...patch } : r)))
  }

  async function handleSave() {
    const bad = rows.find(r => r.is_working && !(timeToMin(r.start_time) < timeToMin(r.end_time)))
    if (bad) {
      setError(`${WEEKDAYS_SHORT[bad.day_of_week]}: начало должно быть раньше конца`)
      return
    }
    setError(null)
    setSaving(true)
    try {
      await saveSchedule(master.id, rows)
      setSaved(JSON.stringify(rows))
      setDone(true)
      notifyDataChanged()
      onSaved?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section title="График на неделю">
      <div className="space-y-1">
        {rows.map(r => (
          <div key={r.day_of_week} className="flex flex-wrap items-center gap-x-3 gap-y-1 min-h-[44px]">
            <span className="w-7 text-sm text-gray-400 flex-shrink-0">{WEEKDAYS_SHORT[r.day_of_week]}</span>
            {readOnly ? (
              <span className="text-sm" style={{ color: r.is_working ? '#ffffff' : '#6b7280' }}>
                {r.is_working ? `${r.start_time}–${r.end_time}` : 'Выходной'}
              </span>
            ) : (
              <>
                <Checkbox checked={r.is_working} onChange={v => update(r.day_of_week, { is_working: v })} label="Работает" className="w-32" />
                <div className="flex items-center gap-2" style={{ opacity: r.is_working ? 1 : 0.4 }}>
                  <span className="text-gray-500 text-xs">с</span>
                  <input
                    type="time"
                    step={900}
                    aria-label="Начало"
                    value={r.start_time}
                    disabled={!r.is_working}
                    onChange={e => update(r.day_of_week, { start_time: e.target.value.slice(0, 5) })}
                    className="min-h-[40px] px-2 rounded-lg text-white text-sm outline-none"
                    style={timeInputStyle}
                  />
                  <span className="text-gray-500 text-xs">до</span>
                  <input
                    type="time"
                    step={900}
                    aria-label="Конец"
                    value={r.end_time}
                    disabled={!r.is_working}
                    onChange={e => update(r.day_of_week, { end_time: e.target.value.slice(0, 5) })}
                    className="min-h-[40px] px-2 rounded-lg text-white text-sm outline-none"
                    style={timeInputStyle}
                  />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <ErrorText className="mt-3">{error}</ErrorText>
      {!readOnly && (
        <div className="flex items-center justify-end gap-3 mt-3">
          {done && !changed && <span className="text-xs" style={{ color: '#34d399' }}>Сохранено</span>}
          <Button variant="primary" disabled={!changed || saving} onClick={handleSave}>
            {saving ? 'Сохраняем...' : 'Сохранить график'}
          </Button>
        </div>
      )}
    </Section>
  )
}

export function DaysOffSection({ master, readOnly }) {
  const [items, setItems] = useState(null)
  const [newDate, setNewDate] = useState('')
  const [error, setError] = useState(null)
  const [warning, setWarning] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    const today = todayString()
    return fetchDaysOff({ dateFrom: today, dateTo: addDays(today, 60) })
      .then(list => setItems(list.filter(d => d.master === master.id).sort((a, b) => a.date.localeCompare(b.date))))
      .catch(err => setError(err.message))
  }, [master.id])

  useEffect(() => {
    load()
  }, [load])

  async function handleAdd(e) {
    e.preventDefault()
    if (!newDate) return
    setError(null)
    setWarning(null)
    setBusy(true)
    try {
      const result = await addDayOff(master.id, newDate)
      const count = Number(result?.appointments_count) || 0
      if (count > 0) {
        setWarning(`${formatShortDate(newDate)}: у мастера ${count} записей — перенесите или отмените их`)
      }
      setNewDate('')
      notifyDataChanged()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(date) {
    setError(null)
    setBusy(true)
    try {
      await removeDayOff(master.id, date)
      notifyDataChanged()
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section title="Выходные по датам (ближайшие 60 дней)">
      {!readOnly && (
        <form onSubmit={handleAdd} className="flex flex-wrap gap-2 mb-3">
          <TextInput type="date" min={todayString()} value={newDate} onChange={e => setNewDate(e.target.value)} className="flex-1 min-w-[150px]" aria-label="Дата выходного" />
          <Button type="submit" variant="primary" disabled={!newDate || busy}>Добавить</Button>
        </form>
      )}
      <WarningText className="mb-3">{warning}</WarningText>
      <ErrorText className="mb-3">{error}</ErrorText>
      {items === null && !error && <p className="text-gray-500 text-sm">Загрузка...</p>}
      {items && items.length === 0 && <p className="text-gray-500 text-sm">Выходных по датам нет</p>}
      {items && items.length > 0 && (
        <div className="space-y-1">
          {items.map(d => (
            <div key={d.id ?? d.date} className="flex items-center justify-between gap-2 min-h-[44px]">
              <span className="text-white text-sm">{formatShortDate(d.date)}</span>
              {!readOnly && (
                <Button variant="ghost" disabled={busy} onClick={() => handleRemove(d.date)} style={{ color: '#f87171' }}>Удалить</Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}

export function AccessSection({ master, onChanged }) {
  const [username, setUsername] = useState(master.user || '')
  const [password, setPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleGrant(e) {
    e.preventDefault()
    const login = username.trim()
    if (!login || !password) {
      setError('Укажите логин и пароль')
      return
    }
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      const result = await setMasterAccess(master.id, login, password)
      setPassword('')
      setChangingPassword(false)
      setMessage(master.has_access ? 'Сохранено' : `Доступ выдан, логин: ${result?.username || login}`)
      onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleRevoke() {
    if (!window.confirm(`Отключить доступ мастера ${master.name} в панель?`)) return
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      await revokeMasterAccess(master.id)
      setUsername('')
      onChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section title="Доступ в панель">
      {master.has_access ? (
        <>
          <p className="text-sm text-gray-400 mb-3">
            Логин: <span className="text-white">{master.user || '—'}</span>
          </p>
          {changingPassword ? (
            <form onSubmit={handleGrant} className="space-y-3">
              <Field label="Логин">
                <TextInput value={username} onChange={e => setUsername(e.target.value)} autoComplete="off" />
              </Field>
              <Field label="Новый пароль">
                <TextInput type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="primary" disabled={busy}>Сохранить</Button>
                <Button disabled={busy} onClick={() => { setChangingPassword(false); setPassword(''); setUsername(master.user || ''); setError(null) }}>Отмена</Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button disabled={busy} onClick={() => { setChangingPassword(true); setMessage(null) }}>Сменить пароль</Button>
              <Button variant="danger" disabled={busy} onClick={handleRevoke}>Отключить доступ</Button>
            </div>
          )}
        </>
      ) : (
        <form onSubmit={handleGrant} className="space-y-3">
          <p className="text-gray-500 text-xs">Мастер сможет входить в панель и видеть свои записи.</p>
          <Field label="Логин">
            <TextInput value={username} onChange={e => setUsername(e.target.value)} autoComplete="off" autoCapitalize="none" />
          </Field>
          <Field label="Пароль">
            <TextInput type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
          </Field>
          <Button type="submit" variant="primary" disabled={busy}>Дать доступ</Button>
        </form>
      )}
      <ErrorText className="mt-3">{error}</ErrorText>
      {message && <p className="text-xs mt-3" style={{ color: '#34d399' }}>{message}</p>}
    </Section>
  )
}
