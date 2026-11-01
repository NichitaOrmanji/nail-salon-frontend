import { useState, useEffect, useMemo } from 'react'
import { isValidPhoneNumber } from 'libphonenumber-js'
import Modal from '../Modal'
import { Button, Field, TextInput, TextArea, Select, ErrorText, WarningText } from '../ui'
import PhoneField from '../../../components/layout/PhoneField'
import { createAppointment, updateAppointment, fetchFreeTimes, lookupClient } from '../../api/appointments'
import { fetchStaffServices } from '../../api/services'
import { notifyDataChanged } from '../../utils/events'
import { formatShortDate, timeToMin, todayString, nowMinutes } from '../../utils/time'
import { formatMoney } from '../../utils/money'
import { DISCARD_CONFIRM } from '../../utils/journal'

function isValidTime(value) {
  return /^\d{2}:\d{2}$/.test(value || '')
}

function parseDuration(value) {
  const n = Number(value)
  return Number.isInteger(n) && n >= 5 && n <= 600 ? n : null
}

// Модалка создания (appointment не передан) или редактирования записи.
// initial — { masterId, date, time } из клика по сетке или { phone, name } («Записать снова»).
export default function AppointmentFormModal({ appointment, initial, masters, me, isManager, onClose, onSaved }) {
  const isEdit = !!appointment

  // Исходные значения формы — для PATCH отправляем только то, что изменилось
  const [start] = useState(() => isEdit
    ? {
      phone: appointment.client_phone || '',
      name: appointment.client_name || '',
      masterId: appointment.master ? String(appointment.master.id) : '',
      serviceId: appointment.service ? String(appointment.service.id) : '',
      duration: String(appointment.duration ?? ''),
      date: appointment.date,
      time: appointment.start_time,
      notes: appointment.notes || '',
    }
    : {
      phone: initial?.phone || '',
      name: initial?.name || '',
      masterId: isManager
        ? (initial?.masterId ? String(initial.masterId) : '')
        : (me.master_id ? String(me.master_id) : ''),
      serviceId: '',
      duration: '',
      date: initial?.date || todayString(),
      time: initial?.time || '',
      notes: '',
    })

  const [phone, setPhone] = useState(start.phone)
  const [name, setName] = useState(start.name)
  const [masterId, setMasterId] = useState(start.masterId)
  const [serviceId, setServiceId] = useState(start.serviceId)
  const [duration, setDuration] = useState(start.duration)
  const [date, setDate] = useState(start.date)
  const [time, setTime] = useState(start.time)
  const [notes, setNotes] = useState(start.notes)
  const [status, setStatus] = useState('confirmed')

  const [services, setServices] = useState(null)
  const [servicesError, setServicesError] = useState(null)
  const [lookup, setLookup] = useState(null) // { phone, data | null }
  const [free, setFree] = useState(null) // { key, data | null, error }
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStaffServices().then(setServices).catch(err => setServicesError(err.message))
  }, [])

  const master = masters.find(m => String(m.id) === masterId) || null
  const phoneValid = !!phone && isValidPhoneNumber(phone)
  const durationNum = parseDuration(duration)

  // Поиск клиента по телефону (с небольшой задержкой, пока печатают)
  useEffect(() => {
    if (!phoneValid) return
    let cancelled = false
    const timer = setTimeout(() => {
      lookupClient(phone)
        .then(data => {
          if (cancelled) return
          setLookup({ phone, data })
          if (data?.name) setName(current => (current.trim() ? current : data.name))
        })
        .catch(() => {
          if (!cancelled) setLookup({ phone, data: null })
        })
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [phone, phoneValid])

  // Свободное время мастера: перезапрос при смене мастера/услуги/длительности/даты
  const freeKey = masterId && date && (durationNum || serviceId)
    ? `${masterId}|${date}|${durationNum || ''}|${serviceId}`
    : null
  useEffect(() => {
    if (!freeKey) return
    let cancelled = false
    const timer = setTimeout(() => {
      fetchFreeTimes({
        master: masterId,
        date,
        duration: durationNum,
        service: serviceId || undefined,
        exclude: isEdit ? appointment.id : undefined,
      })
        .then(data => { if (!cancelled) setFree({ key: freeKey, data }) })
        .catch(err => { if (!cancelled) setFree({ key: freeKey, data: null, error: err.message }) })
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // freeKey уже включает все параметры запроса
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freeKey])

  const freeData = free && free.key === freeKey ? free.data : null
  const freeError = free && free.key === freeKey ? free.error : null
  const clientInfo = lookup && lookup.phone === phone && phoneValid ? lookup : null

  // Мастера для выбора: активные + текущий скрытый (при редактировании)
  const masterOptions = useMemo(() => {
    return masters.filter(m => m.is_active || String(m.id) === start.masterId)
  }, [masters, start.masterId])

  // Услуги выбранного мастера (активные) + текущая услуга записи, даже скрытая
  const serviceOptions = useMemo(() => {
    if (!services) return []
    const ids = new Set(master?.services || [])
    const list = services.filter(s => s.is_active && ids.has(s.id))
    if (isEdit && appointment.service && !list.some(s => s.id === appointment.service.id)) {
      const current = services.find(s => s.id === appointment.service.id) || { ...appointment.service, duration: appointment.duration }
      list.unshift(current)
    }
    return list
  }, [services, master, isEdit, appointment])

  function handleMasterChange(value) {
    setMasterId(value)
    const next = masters.find(m => String(m.id) === value)
    // Мастер не делает выбранную услугу — выбираем заново
    if (serviceId && next && !(next.services || []).includes(Number(serviceId))) {
      const keepCurrent = isEdit && appointment.service && String(appointment.service.id) === serviceId && value === start.masterId
      if (!keepCurrent) setServiceId('')
    }
  }

  function handleServiceChange(value) {
    setServiceId(value)
    const s = services?.find(x => String(x.id) === value)
    if (s) setDuration(String(s.duration))
  }

  // Предупреждения: вне графика, выходной, прошедшее время
  const warnings = []
  if (freeData && isValidTime(time)) {
    const t = timeToMin(time)
    const end = t + (durationNum || 0)
    const sched = freeData.schedule
    if (freeData.day_off) {
      warnings.push('Вне графика мастера: выходной в этот день')
    } else if (!freeData.working || !sched) {
      warnings.push('Вне графика мастера: по графику не работает')
    } else if (t < timeToMin(sched.start_time) || end > timeToMin(sched.end_time)) {
      warnings.push(`Вне графика мастера (работает ${sched.start_time}–${sched.end_time})`)
    } else if (sched.break_start && sched.break_end && t < timeToMin(sched.break_end) && end > timeToMin(sched.break_start)) {
      warnings.push(`Попадает на обед мастера (${sched.break_start}–${sched.break_end})`)
    }
  }
  const whenChanged = !isEdit || date !== start.date || time !== start.time
  if (whenChanged && date && isValidTime(time)) {
    const today = todayString()
    if (date < today || (date === today && timeToMin(time) < nowMinutes())) {
      warnings.push('Это время уже прошло')
    }
  }

  // Чипы — свободное время мастера; введённое вручную время вне списка — предупреждаем
  // (сохранить всё равно можно, окончательно решает сервер)
  const freeTimes = freeData && Array.isArray(freeData.times) ? freeData.times : null
  const timeEdited = !isEdit || date !== start.date || time !== start.time || duration !== start.duration || serviceId !== start.serviceId || masterId !== start.masterId
  if (timeEdited && freeTimes && isValidTime(time) && !warnings.length && !freeTimes.includes(time)) {
    warnings.push('Это время занято или вне графика')
  }

  const masterChanged = masterId !== start.masterId
  const serviceRequired = !isEdit || masterChanged
  // У записи без мастера можно менять клиента и заметку, но перенос — только с мастером
  const slotChanged = date !== start.date || time !== start.time || duration !== start.duration || serviceId !== start.serviceId
  const masterRequired = !isEdit || masterChanged || slotChanged
  const validationError =
    (!isEdit || phone !== start.phone) && !phoneValid ? 'Укажите корректный телефон'
      : !name.trim() ? 'Укажите имя клиента'
        : masterRequired && !masterId ? 'Укажите мастера'
          : serviceRequired && !serviceId ? 'Выберите услугу'
            : !durationNum && (serviceRequired || duration !== start.duration) ? 'Длительность — от 5 до 600 минут'
              : !date ? 'Укажите дату'
                : !isValidTime(time) ? 'Укажите время'
                  : null

  // Есть несохранённый ввод — закрытие (Escape, крестик, «Отмена») переспрашивает
  const dirty = phone !== start.phone || name !== start.name || masterId !== start.masterId || serviceId !== start.serviceId ||
    duration !== start.duration || date !== start.date || time !== start.time || notes !== start.notes || status !== 'confirmed'

  function requestClose() {
    if (saving) return
    if (dirty && !window.confirm(DISCARD_CONFIRM)) return
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (saving) return
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)

    let body
    if (isEdit) {
      body = {}
      if (phone !== start.phone) body.client_phone = phone
      if (name.trim() !== start.name) body.client_name = name.trim()
      if (masterChanged) body.master = Number(masterId)
      if (serviceId && serviceId !== start.serviceId) {
        body.service = Number(serviceId)
        // При смене услуги длительность передаём явно, чтобы бэк не взял её из услуги
        if (durationNum) body.duration = durationNum
      }
      if (durationNum && duration !== start.duration) body.duration = durationNum
      if (date !== start.date) body.date = date
      if (time !== start.time) body.start_time = time
      if (notes !== start.notes) body.notes = notes
      if (!Object.keys(body).length) {
        onClose()
        return
      }
    } else {
      body = {
        master: Number(masterId),
        service: Number(serviceId),
        date,
        start_time: time,
        duration: durationNum,
        client_name: name.trim(),
        client_phone: phone,
        notes: notes.trim(),
      }
      // Мастеру статус не выбрать — бэк всегда ставит «Подтверждена»
      if (isManager) body.status = status
    }

    setSaving(true)
    try {
      const saved = isEdit ? await updateAppointment(appointment.id, body) : await createAppointment(body)
      notifyDataChanged()
      onSaved(saved)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  // Ошибка — над кнопками, в закреплённом низу окна: на телефоне её видно сразу
  const footer = (
    <>
      {error && (
        <p role="alert" className="basis-full text-red-400 text-sm">{error}</p>
      )}
      <Button onClick={requestClose}>Отмена</Button>
      <Button variant="primary" type="submit" form="appointment-form" disabled={saving}>
        {saving ? 'Сохраняем...' : isEdit ? 'Сохранить' : 'Создать запись'}
      </Button>
    </>
  )

  return (
    <Modal title={isEdit ? 'Изменить запись' : 'Новая запись'} onClose={requestClose} footer={footer}>
      <form id="appointment-form" onSubmit={handleSubmit} noValidate className="space-y-4">

        {/* Не <label>-обёртка: иначе подпись относится к кнопке выбора страны, а не к полю номера */}
        <div>
          <label htmlFor="appointment-phone" className="block text-gray-400 text-xs font-medium mb-1.5">Телефон</label>
          {/* Без overflow-hidden: иначе обрезается список стран */}
          <div className="rounded-xl relative" style={{ backgroundColor: '#242424', border: '1px solid #2e2e2e' }}>
            <PhoneField value={phone} onChange={setPhone} inputId="appointment-phone" inputLabel="Телефон" />
          </div>
        </div>
        {phone && !phoneValid && <p className="text-gray-500 text-xs -mt-2">Проверьте номер телефона</p>}
        {clientInfo && (
          <p className="text-xs -mt-2">
            {clientInfo.data ? (
              <>
                <span className="text-gray-400">Визитов: {clientInfo.data.visits ?? 0}</span>
                <span className="text-gray-600"> · </span>
                <span style={{ color: clientInfo.data.no_shows > 0 ? '#f87171' : '#9ca3af' }}>
                  Не пришёл: {clientInfo.data.no_shows ?? 0}
                </span>
              </>
            ) : (
              <span className="text-gray-500">Новый клиент</span>
            )}
          </p>
        )}
        {clientInfo?.data?.blacklist && (
          <div className="rounded-xl px-3 py-2 text-sm -mt-1" role="alert"
            style={{ backgroundColor: 'rgba(248, 113, 113, 0.12)', border: '1px solid #f87171', color: '#fca5a5' }}>
            <div className="font-semibold" style={{ color: '#f87171' }}>⛔ Клиент в чёрном списке</div>
            {Number(clientInfo.data.blacklist.debt) > 0 ? (
              <>
                <div>Долг {formatMoney(clientInfo.data.blacklist.debt)} — оплатит при визите</div>
                {(clientInfo.data.penalties || []).map(p => (
                  <div key={p.id} className="text-xs text-gray-400">
                    {formatShortDate(p.date)} · {p.kind === 'no_show' ? 'не пришёл' : 'поздняя отмена'}
                    {p.service ? ` · ${p.service}` : ''} · {formatMoney(p.amount)}
                  </div>
                ))}
              </>
            ) : <div>Долгов нет, нарушений: {clientInfo.data.blacklist.count}</div>}
          </div>
        )}

        <Field label="Имя">
          <TextInput value={name} onChange={e => setName(e.target.value)} placeholder="Имя клиента" />
        </Field>

        <Field label="Мастер">
          {isManager ? (
            <Select value={masterId} onChange={e => handleMasterChange(e.target.value)}>
              <option value="">— Выберите мастера —</option>
              {masterOptions.map(m => (
                <option key={m.id} value={String(m.id)}>{m.name}{m.is_active ? '' : ' (скрыт)'}</option>
              ))}
            </Select>
          ) : (
            <TextInput value={master?.name || me.name || ''} disabled readOnly />
          )}
        </Field>

        <Field label="Услуга">
          <Select value={serviceId} onChange={e => handleServiceChange(e.target.value)} disabled={!services}>
            <option value="">
              {!services ? 'Загрузка...' : !masterId ? '— Сначала выберите мастера —' : '— Выберите услугу —'}
            </option>
            {serviceOptions.map(s => (
              <option key={s.id} value={String(s.id)}>
                {s.name}{s.is_active === false ? ' (скрыта)' : ''}
              </option>
            ))}
          </Select>
        </Field>
        <ErrorText>{servicesError}</ErrorText>
        {services && master && serviceOptions.length === 0 && (
          <p className="text-gray-500 text-xs -mt-2">У мастера нет активных услуг</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Длительность, мин">
            <TextInput type="number" inputMode="numeric" min={5} max={600} step={5} value={duration} onChange={e => setDuration(e.target.value)} />
          </Field>
          <Field label="Дата">
            <TextInput type="date" value={date} onChange={e => setDate(e.target.value)} />
          </Field>
        </div>

        <Field label="Время">
          <TextInput type="time" step={900} value={time} onChange={e => setTime(e.target.value.slice(0, 5))} />
        </Field>

        {/* Чипы свободного времени */}
        {freeKey && (
          <div className="-mt-1">
            {!freeData && !freeError && <p className="text-gray-500 text-xs">Ищем свободное время...</p>}
            {freeError && <p className="text-red-400 text-xs">{freeError}</p>}
            {freeData && Array.isArray(freeData.times) && freeData.times.length === 0 && (
              <p className="text-gray-500 text-xs">Свободного времени нет</p>
            )}
            {freeData && Array.isArray(freeData.times) && freeData.times.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                {freeData.times.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTime(t)}
                    className="min-h-[44px] px-3 rounded-lg text-sm font-medium"
                    style={{
                      backgroundColor: t === time ? '#db2777' : '#242424',
                      color: t === time ? '#ffffff' : '#d1d5db',
                      border: '1px solid #2e2e2e',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {warnings.map(w => <WarningText key={w}>{w}</WarningText>)}

        <Field label="Заметка">
          <TextArea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Необязательно" />
        </Field>

        {!isEdit && isManager && (
          <Field label="Статус">
            <Select value={status} onChange={e => setStatus(e.target.value)}>
              <option value="confirmed">Подтверждена</option>
              <option value="pending">Ожидает</option>
            </Select>
          </Field>
        )}
      </form>
    </Modal>
  )
}
