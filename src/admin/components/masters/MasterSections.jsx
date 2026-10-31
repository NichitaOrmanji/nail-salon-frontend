import { useState, useEffect, useCallback } from 'react'
import { saveSchedule, fetchDaysOff, addDayOff, removeDayOff, setMasterAccess, revokeMasterAccess } from '../../api/masters'
import { notifyDataChanged } from '../../utils/events'
import { WEEKDAYS_SHORT, todayString, addDays, formatShortDate } from '../../utils/time'
import { Button, Checkbox, ErrorText, Field, TextInput, WarningText } from '../ui'
import { dayHoursError, hoursLabel, lunchLabel } from '../../utils/schedule'
import TimeField from './TimeField'

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
      break_start: found?.break_start || null,
      break_end: found?.break_end || null,
    }
  })
}

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

  // Обед первого рабочего дня с обедом — во все рабочие дни
  function copyLunch() {
    const source = rows.find(r => r.is_working && r.break_start && r.break_end)
    if (!source) return
    setDone(false)
    setRows(list => list.map(r => (r.is_working ? { ...r, break_start: source.break_start, break_end: source.break_end } : r)))
  }

  async function handleSave() {
    for (const r of rows.filter(row => row.is_working)) {
      const message = dayHoursError(r)
      if (message) {
        setError(`${WEEKDAYS_SHORT[r.day_of_week]}: ${message}`)
        return
      }
    }
    setError(null)
    setSaving(true)
    try {
      // У нерабочего дня обед не отправляем
      await saveSchedule(master.id, rows.map(r => (r.is_working ? r : { ...r, break_start: null, break_end: null })))
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

  const canCopyLunch = rows.some(r => r.is_working && r.break_start && r.break_end)

  return (
    <Section title="График на неделю (шаблон)">
      {!readOnly && (
        <p className="text-gray-500 text-xs mb-3">
          Действует на все недели. Отдельные даты (другие часы, выходной) — во вкладке «Графики».
          Обед клиентам не показывается: записаться на это время нельзя.
        </p>
      )}
      <div className="space-y-2">
        {rows.map(r => (
          <div key={r.day_of_week} className="flex flex-wrap items-center gap-x-3 gap-y-1 min-h-[44px] py-1" style={{ borderTop: r.day_of_week ? '1px solid #2a2a2a' : 'none' }}>
            <span className="w-7 text-sm text-gray-400 flex-shrink-0">{WEEKDAYS_SHORT[r.day_of_week]}</span>
            {readOnly ? (
              <span className="text-sm" style={{ color: r.is_working ? '#ffffff' : '#6b7280' }}>
                {r.is_working ? hoursLabel(r) : 'Выходной'}
                {r.is_working && lunchLabel(r) && <span className="text-gray-500"> · обед {lunchLabel(r)}</span>}
              </span>
            ) : (
              <>
                <Checkbox checked={r.is_working} onChange={v => update(r.day_of_week, { is_working: v })} label="Работает" className="w-32" />
                {r.is_working && (
                  <div className="w-full sm:w-auto pl-8 sm:pl-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-gray-500 text-xs w-10">с</span>
                      <TimeField label="Начало" value={r.start_time} onChange={v => update(r.day_of_week, { start_time: v })} />
                      <span className="text-gray-500 text-xs">до</span>
                      <TimeField label="Конец" value={r.end_time} onChange={v => update(r.day_of_week, { end_time: v })} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-gray-500 text-xs w-10">обед</span>
                      <TimeField label="Начало обеда" value={r.break_start} onChange={v => update(r.day_of_week, { break_start: v })} />
                      <span className="text-gray-500 text-xs">до</span>
                      <TimeField label="Конец обеда" value={r.break_end} clearable
                        onChange={v => update(r.day_of_week, v ? { break_end: v } : { break_start: null, break_end: null })} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
      <ErrorText className="mt-3">{error}</ErrorText>
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-end gap-3 mt-3">
          {done && !changed && <span className="text-xs" style={{ color: '#34d399' }}>Сохранено</span>}
          {canCopyLunch && <Button onClick={copyLunch}>Обед во все рабочие дни</Button>}
          <Button variant="primary" disabled={!changed || saving} onClick={handleSave}>
            {saving ? 'Сохраняем...' : 'Сохранить график'}
          </Button>
        </div>
      )}
    </Section>
  )
}

// Выходные по датам показываем и добавляем на год вперёд
const DAYS_OFF_AHEAD = 365

export function DaysOffSection({ master, readOnly }) {
  const [items, setItems] = useState(null)
  const [newDate, setNewDate] = useState('')
  const [error, setError] = useState(null)
  const [warning, setWarning] = useState(null)
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  const today = todayString()
  const maxDate = addDays(today, DAYS_OFF_AHEAD)

  const load = useCallback(() => {
    const from = todayString()
    return fetchDaysOff({ dateFrom: from, dateTo: addDays(from, DAYS_OFF_AHEAD) })
      .then(list => setItems(list.filter(d => d.master === master.id).sort((a, b) => a.date.localeCompare(b.date))))
      .catch(err => setError(err.message))
  }, [master.id])

  useEffect(() => {
    load()
  }, [load])

  async function handleAdd(e) {
    e.preventDefault()
    if (!newDate) return
    if (newDate < today || newDate > maxDate) {
      setError(`Выберите дату с ${formatShortDate(today)} по ${formatShortDate(maxDate)}`)
      return
    }
    setError(null)
    setWarning(null)
    setMessage(null)
    setBusy(true)
    try {
      const result = await addDayOff(master.id, newDate)
      const count = Number(result?.appointments_count) || 0
      setMessage(`Выходной добавлен: ${formatShortDate(newDate)}`)
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
    setMessage(null)
    setWarning(null)
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
    <Section title="Выходные по датам (на год вперёд)">
      {!readOnly && (
        <form onSubmit={handleAdd} noValidate className="flex flex-wrap gap-2 mb-3">
          <TextInput
            type="date"
            min={today}
            max={maxDate}
            value={newDate}
            onChange={e => { setNewDate(e.target.value); setMessage(null) }}
            className="flex-1 min-w-[150px]"
            aria-label="Дата выходного"
          />
          <Button type="submit" variant="primary" disabled={!newDate || busy}>Добавить</Button>
        </form>
      )}
      {message && <p className="text-xs mb-3" style={{ color: '#34d399' }}>{message}</p>}
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

// Ключ — только id мастера: после перезагрузки списка секция не пересоздаётся,
// и сообщение «Доступ выдан, логин: …» остаётся на экране
export function AccessSection({ master, onChanged }) {
  const [username, setUsername] = useState(master.user || '')
  const [password, setPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  // Логин или доступ изменились (сохранили, перезагрузили список) — поля берём из данных мастера
  const accessKey = `${master.user || ''}|${master.has_access}`
  const [syncedKey, setSyncedKey] = useState(accessKey)
  if (accessKey !== syncedKey) {
    setSyncedKey(accessKey)
    setUsername(master.user || '')
    setPassword('')
    setChangingPassword(false)
  }

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
      setMessage('Доступ отключён')
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
