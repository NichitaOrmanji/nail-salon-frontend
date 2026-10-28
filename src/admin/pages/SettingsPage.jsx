import { useState, useEffect } from 'react'
import { fetchStaffCompany, updateStaffCompany } from '../api/company'
import { useStaffAuth } from '../context/StaffAuthContext'
import { normalizeDecimal } from '../utils/time'
import { Button, ErrorText, Field, PageHeader, TextArea, TextInput } from '../components/ui'
import Spinner from '../../components/layout/Spinner'

const FIELDS = ['name', 'address', 'phone', 'description']

function toForm(company) {
  return {
    name: company.name || '',
    address: company.address || '',
    phone: company.phone || '',
    description: company.description || '',
    latitude: company.latitude === null || company.latitude === undefined ? '' : String(company.latitude),
    longitude: company.longitude === null || company.longitude === undefined ? '' : String(company.longitude),
    cancel_hours: String(company.cancel_hours ?? 0),
  }
}

// Координата: '' -> null, «47,0447862» -> 47.0447862; NaN — ошибка
function parseCoordinate(value) {
  const normalized = normalizeDecimal(value)
  if (normalized === '') return null
  return Number(normalized)
}

export default function SettingsPage() {
  const { refreshMe } = useStaffAuth()
  const [form, setForm] = useState(null)
  const [initial, setInitial] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    fetchStaffCompany()
      .then(data => {
        setForm(toForm(data))
        setInitial(toForm(data))
      })
      .catch(err => setLoadError(err.message))
  }, [])

  function set(field, value) {
    setDone(false)
    setForm(f => ({ ...f, [field]: value }))
  }

  // Вставили пару из Google Maps «47.0447862, 28.8607939» — раскладываем по двум полям.
  // Только при вставке: при наборе с клавиатуры пара «47.04, 28.8» ещё не дописана
  function handleCoordinatePaste(e) {
    const text = e.clipboardData?.getData('text') || ''
    const pair = text.match(/^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/)
    if (!pair) return
    e.preventDefault()
    setDone(false)
    setForm(f => ({ ...f, latitude: pair[1], longitude: pair[2] }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Укажите название салона')
      return
    }
    const latitude = parseCoordinate(form.latitude)
    const longitude = parseCoordinate(form.longitude)
    if (Number.isNaN(latitude) || (latitude !== null && Math.abs(latitude) > 90)) {
      setError('Широта — число от -90 до 90')
      return
    }
    if (Number.isNaN(longitude) || (longitude !== null && Math.abs(longitude) > 180)) {
      setError('Долгота — число от -180 до 180')
      return
    }

    const cancelHours = form.cancel_hours.trim() === '' ? 0 : Number(form.cancel_hours)
    if (!Number.isInteger(cancelHours) || cancelHours < 0 || cancelHours > 168) {
      setError('Срок отмены — целое число часов от 0 до 168')
      return
    }

    const body = {}
    if (form.cancel_hours !== initial.cancel_hours) body.cancel_hours = cancelHours
    for (const field of FIELDS) {
      const value = field === 'name' ? form[field].trim() : form[field]
      if (value !== initial[field]) body[field] = value
    }
    if (form.latitude !== initial.latitude) body.latitude = latitude
    if (form.longitude !== initial.longitude) body.longitude = longitude

    if (!Object.keys(body).length) {
      setDone(true)
      return
    }

    setError(null)
    setSaving(true)
    try {
      const saved = await updateStaffCompany(body)
      setForm(toForm(saved))
      setInitial(toForm(saved))
      setDone(true)
      // Название салона в шапке берётся из /me/
      if ('name' in body) refreshMe().catch(() => {})
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 md:px-6 py-5 max-w-2xl">
      <PageHeader title="Настройки" subtitle="Данные салона на сайте записи" />
      <ErrorText className="mb-3">{loadError}</ErrorText>
      {!form && !loadError && <Spinner />}
      {form && (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label="Название">
            <TextInput value={form.name} onChange={e => set('name', e.target.value)} />
          </Field>
          <Field label="Адрес">
            <TextInput value={form.address} onChange={e => set('address', e.target.value)} />
          </Field>
          <Field label="Телефон">
            <TextInput type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </Field>
          <Field label="Описание">
            <TextArea rows={4} value={form.description} onChange={e => set('description', e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Широта">
              <TextInput inputMode="decimal" value={form.latitude} onChange={e => set('latitude', e.target.value)} onPaste={handleCoordinatePaste} placeholder="47.044786" />
            </Field>
            <Field label="Долгота">
              <TextInput inputMode="decimal" value={form.longitude} onChange={e => set('longitude', e.target.value)} onPaste={handleCoordinatePaste} placeholder="28.860794" />
            </Field>
          </div>
          <p className="text-gray-500 text-xs -mt-2">
            Координаты: правый клик по точке в Google Maps → нажмите на числа (скопируются широта и долгота).
            Можно вставить пару целиком в любое поле; запятая в числе заменится точкой.
          </p>
          <Field
            label="Клиент может отменить запись сам не позже чем за, часов"
            hint="0 — до самого начала визита. Позже клиент видит «позвоните в салон»; персонал отменяет в журнале всегда."
          >
            <TextInput inputMode="numeric" value={form.cancel_hours} onChange={e => set('cancel_hours', e.target.value.replace(/\D/g, ''))} placeholder="0" />
          </Field>
          <ErrorText>{error}</ErrorText>
          <div className="flex items-center justify-end gap-3">
            {done && <span className="text-xs" style={{ color: '#34d399' }}>Сохранено</span>}
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Сохраняем...' : 'Сохранить'}</Button>
          </div>
        </form>
      )}
    </div>
  )
}
