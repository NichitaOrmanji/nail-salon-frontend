import { useState, useEffect } from 'react'
import { deleteCompanyPhoto, fetchStaffCompany, updateStaffCompany, uploadCompanyPhoto } from '../api/company'
import { useStaffAuth } from '../context/StaffAuthContext'
import { t } from '../../i18n'
import { normalizeDecimal } from '../utils/time'
import { Button, ErrorText, Field, TextArea, TextInput } from './ui'
import PhotoField from './PhotoField'
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
    penalty_percent: String(company.penalty_percent ?? 0),
    penalty_on: Number(company.penalty_percent ?? 0) > 0,
    late_cancel_hours: String(company.late_cancel_hours ?? 0),
    auto_confirm: Boolean(company.auto_confirm),
  }
}

// Координата: '' -> null, «47,0447862» -> 47.0447862; NaN — ошибка
function parseCoordinate(value) {
  const normalized = normalizeDecimal(value)
  if (normalized === '') return null
  return Number(normalized)
}

// part: 'info' — фото, название, адрес, телефон, описание, карта (страница «О салоне»);
// 'rules' — отмена, автоподтверждение, штрафы (настройки). Сохраняются только изменённые поля.
export default function SalonForm({ part }) {
  const info = part === 'info'
  const { refreshMe } = useStaffAuth()
  const [form, setForm] = useState(null)
  const [initial, setInitial] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  // Фото сохраняются сразу при выборе файла, отдельно от формы
  const [photos, setPhotos] = useState(null)

  useEffect(() => {
    fetchStaffCompany()
      .then(data => {
        setForm(toForm(data))
        setInitial(toForm(data))
        setPhotos({ logo: data.logo, main_photo: data.main_photo })
      })
      .catch(err => setLoadError(err.message))
  }, [])

  function set(field, value) {
    setDone(false)
    setForm(f => ({ ...f, [field]: value }))
  }

  // Выключение ставит 0 %, включение — прежний процент или 50
  const penaltyOn = !!form?.penalty_on
  function togglePenalty(on) {
    setDone(false)
    setForm(f => {
      if (!on) return { ...f, penalty_on: false, penalty_percent: '0' }
      const previous = Number(initial?.penalty_percent || 0)
      return { ...f, penalty_on: true, penalty_percent: String(previous > 0 ? previous : 50) }
    })
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

  async function changePhoto(kind, file) {
    const saved = file ? await uploadCompanyPhoto(kind, file) : await deleteCompanyPhoto(kind)
    setPhotos({ logo: saved.logo, main_photo: saved.main_photo })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) {
      setError(t('Укажите название салона'))
      return
    }
    const latitude = parseCoordinate(form.latitude)
    const longitude = parseCoordinate(form.longitude)
    if (Number.isNaN(latitude) || (latitude !== null && Math.abs(latitude) > 90)) {
      setError(t('Широта — число от -90 до 90'))
      return
    }
    if (Number.isNaN(longitude) || (longitude !== null && Math.abs(longitude) > 180)) {
      setError(t('Долгота — число от -180 до 180'))
      return
    }

    const cancelHours = form.cancel_hours.trim() === '' ? 0 : Number(form.cancel_hours)
    if (!Number.isInteger(cancelHours) || cancelHours < 0 || cancelHours > 168) {
      setError(t('Срок отмены — целое число часов от 0 до 168'))
      return
    }

    const penaltyPercent = !form.penalty_on ? 0 : form.penalty_percent.trim() === '' ? 0 : Number(form.penalty_percent)
    if (form.penalty_on && penaltyPercent === 0) {
      setError(t('Укажите процент штрафа или выключите штрафы'))
      return
    }
    if (!Number.isInteger(penaltyPercent) || penaltyPercent < 0 || penaltyPercent > 100) {
      setError(t('Штраф — целое число процентов от 0 до 100'))
      return
    }
    const lateHours = form.late_cancel_hours.trim() === '' ? 0 : Number(form.late_cancel_hours)
    if (!Number.isInteger(lateHours) || lateHours < 0 || lateHours > 48) {
      setError(t('Поздняя отмена — целое число часов от 0 до 48'))
      return
    }

    const body = {}
    if (form.cancel_hours !== initial.cancel_hours) body.cancel_hours = cancelHours
    if (penaltyPercent !== Number(initial.penalty_percent || 0)) body.penalty_percent = penaltyPercent
    if (form.late_cancel_hours !== initial.late_cancel_hours) body.late_cancel_hours = lateHours
    if (form.auto_confirm !== initial.auto_confirm) body.auto_confirm = form.auto_confirm
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
      // Название салона в шапке и правила чёрного списка в журнале берутся из /me/
      if ('name' in body || 'penalty_percent' in body || 'late_cancel_hours' in body) refreshMe().catch(() => {})
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2 className="text-ink text-base font-semibold mb-1">{info ? t('Данные салона') : t('Правила записи')}</h2>
      <p className="text-gray-500 text-xs mb-4">{info ? t('Как салон выглядит на сайте записи') : t('Отмена записи, подтверждение и штрафы')}</p>
      <ErrorText className="mb-3">{loadError}</ErrorText>
      {!form && !loadError && <Spinner />}
      {info && photos && (
        <section className="rounded-2xl p-4 mb-5 space-y-5" style={{ backgroundColor: 'var(--c-card)', border: '1px solid var(--c-line)' }}>
          <PhotoField
            label={t('Главное фото салона')}
            hint={t('Шапка сайта записи. Лучше горизонтальное. Сохраняется сразу.')}
            url={photos.main_photo}
            shape="wide"
            maxSide={1600}
            onUpload={file => changePhoto('main-photo', file)}
            onRemove={() => changePhoto('main-photo', null)}
          />
          <PhotoField
            label={t('Логотип')}
            hint={t('Квадратный, PNG с прозрачным фоном тоже подойдёт.')}
            url={photos.logo}
            shape="round"
            maxSide={600}
            keepPng
            onUpload={file => changePhoto('logo', file)}
            onRemove={() => changePhoto('logo', null)}
          />
        </section>
      )}
      {form && (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {info && <>
          <Field label={t('Название')}>
            <TextInput value={form.name} onChange={e => set('name', e.target.value)} />
          </Field>
          <Field label={t('Адрес')}>
            <TextInput value={form.address} onChange={e => set('address', e.target.value)} />
          </Field>
          <Field label={t('Телефон')}>
            <TextInput type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
          </Field>
          <Field label={t('Описание')}>
            <TextArea rows={4} value={form.description} onChange={e => set('description', e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label={t('Широта')}>
              <TextInput inputMode="decimal" value={form.latitude} onChange={e => set('latitude', e.target.value)} onPaste={handleCoordinatePaste} placeholder="47.044786" />
            </Field>
            <Field label={t('Долгота')}>
              <TextInput inputMode="decimal" value={form.longitude} onChange={e => set('longitude', e.target.value)} onPaste={handleCoordinatePaste} placeholder="28.860794" />
            </Field>
          </div>
          <p className="text-gray-500 text-xs -mt-2">
            {t('Координаты: правый клик по точке в Google Maps → нажмите на числа (скопируются широта и долгота). Можно вставить пару целиком в любое поле; запятая в числе заменится точкой.')}
          </p>
          </>}
          {!info && <>
          <Field
            label={t('Клиент может отменить запись сам не позже чем за, часов')}
            hint={t('0 — до самого начала визита. Позже клиент видит «позвоните в салон»; персонал отменяет в журнале всегда.')}
          >
            <TextInput inputMode="numeric" value={form.cancel_hours} onChange={e => set('cancel_hours', e.target.value.replace(/\D/g, ''))} placeholder="0" />
          </Field>
          <label className="flex items-start gap-3 rounded-2xl p-4 cursor-pointer" style={{ backgroundColor: 'var(--c-card)', border: '1px solid var(--c-line)' }}>
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 accent-pink-500"
              checked={form.auto_confirm}
              onChange={e => set('auto_confirm', e.target.checked)}
            />
            <span>
              <span className="block text-ink text-sm font-semibold">{t('Подтверждать онлайн-записи автоматически')}</span>
              <span className="block text-gray-500 text-xs mt-1">
                {t('Включено — запись с сайта сразу «подтверждена». Выключено — запись «ожидает», пока салон не подтвердит её в журнале. В обоих случаях клиенты с Telegram получают напоминание за сутки с кнопкой «Приду», а в журнале видно, кто подтвердил визит и кому позвонить.')}
              </span>
            </span>
          </label>
          <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: 'var(--c-card)', border: '1px solid var(--c-line)' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div id="penalty-title" className="text-ink text-sm font-semibold">{t('Штрафы и чёрный список')}</div>
                <div className="text-xs mt-0.5 font-medium" style={{ color: penaltyOn ? 'var(--c-ok)' : 'var(--c-muted)' }}>
                  {penaltyOn ? t('Включены') : t('Выключены')}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={penaltyOn}
                aria-labelledby="penalty-title"
                onClick={() => togglePenalty(!penaltyOn)}
                className="relative flex-shrink-0 w-14 h-8 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
                style={{ backgroundColor: penaltyOn ? 'var(--accent)' : 'var(--c-line-2)' }}
              >
                <span
                  className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform"
                  style={{ transform: penaltyOn ? 'translateX(24px)' : 'none' }}
                />
              </button>
            </div>
            {penaltyOn ? (
              <>
                <p className="text-gray-500 text-xs">
                  {t('Клиент, который не пришёл или отменил запись слишком поздно, попадает в чёрный список. Штраф он оплачивает в салоне при следующем визите — панель добавит его к счёту. Правило показывается клиентам при записи.')}
                </p>
                <Field label={t('Штраф, % от стоимости пропущенной услуги')}>
                  <TextInput inputMode="numeric" value={form.penalty_percent} onChange={e => set('penalty_percent', e.target.value.replace(/\D/g, ''))} placeholder="50" />
                </Field>
                <Field label={t('Поздняя отмена — меньше чем за, часов до визита')} hint={t('0 — штрафовать только за неявку')}>
                  <TextInput inputMode="numeric" value={form.late_cancel_hours} onChange={e => set('late_cancel_hours', e.target.value.replace(/\D/g, ''))} placeholder="3" />
                </Field>
              </>
            ) : (
              <p className="text-gray-500 text-xs">
                {t('Клиентов не штрафуют за неявку и позднюю отмену, правило штрафа клиентам не показывается. Включите, если хотите, чтобы неявка добавляла штраф к следующему визиту.')}
              </p>
            )}
          </div>
          </>}
          <ErrorText>{error}</ErrorText>
          <div className="flex items-center justify-end gap-3">
            {done && <span className="text-xs" style={{ color: 'var(--c-ok)' }}>{t('Сохранено')}</span>}
            <Button type="submit" variant="primary" disabled={saving}>{saving ? t('Сохраняем...') : t('Сохранить')}</Button>
          </div>
        </form>
      )}
    </div>
  )
}
