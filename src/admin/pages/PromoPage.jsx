import { useEffect, useMemo, useState } from 'react'
import { fetchPromo, fetchWindows, saveMasterLink } from '../api/promo'
import { fetchStaffCompany } from '../api/company'
import { useStaffAuth } from '../context/StaffAuthContext'
import { Button, ErrorText, Field, PageHeader, Select, TextArea, TextInput } from '../components/ui'
import Spinner from '../../components/layout/Spinner'
import { addDays, todayString } from '../utils/time'
import { drawStory, loadImage, periodLabel, TEMPLATES, windowsText } from '../utils/story'
import { DEFAULT_ACCENT } from '../../utils/appearance'
import { SOURCE_LABELS } from '../utils/sources'
import { t } from '../../i18n'

const card = { backgroundColor: 'var(--c-card)', border: '1px solid var(--c-line)' }

const TEXT_CHANNELS = [
  { id: 'telegram', label: 'Telegram' },
  { id: 'viber', label: 'Viber' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'instagram', label: 'Instagram' },
]

// Ссылка салона с меткой источника: …/?from=stories (адрес может уже содержать ?salon=)
function taggedUrl(url, from) {
  try {
    const parsed = new URL(url)
    parsed.searchParams.set('from', from)
    return parsed.toString()
  } catch {
    return url
  }
}

function hostOf(url) {
  try {
    const parsed = new URL(url)
    return parsed.host + (parsed.search || '')
  } catch {
    return url
  }
}

function CopyButton({ text, label = t('Скопировать') }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* нет доступа к буферу — текст можно выделить вручную */ }
  }
  return <Button onClick={copy}>{copied ? t('Скопировано ✓') : label}</Button>
}

function qrImage(url) {
  return import('qrcode')
    .then(QR => QR.toDataURL(url, { width: 480, margin: 1, color: { dark: '#111111', light: '#ffffff' } }))
    .then(loadImage)
    .catch(() => null)
}

// «Свободные окна»: картинка для сторис и текст для Telegram / Viber
function WindowsShare({ promo, company, accent }) {
  const { isManager } = useStaffAuth()
  const [range, setRange] = useState('tomorrow')
  const [master, setMaster] = useState('')
  const [template, setTemplate] = useState(company?.main_photo ? 'photo' : 'accent')
  const [channel, setChannel] = useState('telegram')
  const [days, setDays] = useState(null)
  const [error, setError] = useState(null)
  const [images, setImages] = useState(null)
  const [busy, setBusy] = useState(false)

  const today = todayString()
  const date = range === 'today' ? today : addDays(today, range === 'tomorrow' ? 1 : 0)
  const count = range === 'week' ? 7 : 1
  const storyUrl = taggedUrl(promo.site_url, 'stories')

  useEffect(() => {
    let cancelled = false
    fetchWindows({ date, days: count, master: master || null })
      .then(data => { if (!cancelled) { setDays(data.days.filter(day => day.masters.length)); setError(null) } })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [date, count, master])

  useEffect(() => {
    let cancelled = false
    Promise.all([loadImage(company?.logo), loadImage(company?.main_photo), qrImage(storyUrl)])
      .then(([logo, photo, qr]) => { if (!cancelled) setImages({ logo, photo, qr }) })
    return () => { cancelled = true }
  }, [company?.logo, company?.main_photo, storyUrl])

  const period = periodLabel(range, date)
  // Картинка рисуется на холсте вне страницы; превью — её уменьшенная копия
  const story = useMemo(() => {
    if (!days || !days.length || !images) return null
    const canvas = document.createElement('canvas')
    const look = {
      template, accent, name: company?.name || '', period,
      logo: images.logo, photo: images.photo, qr: images.qr, address: hostOf(promo.site_url),
    }
    drawStory(canvas, days, look)
    try {
      return { canvas, url: canvas.toDataURL('image/jpeg', 0.8) }
    } catch {
      // Фото без разрешения CORS «портит» холст — рисуем без фото и логотипа
      drawStory(canvas, days, { ...look, template: template === 'photo' ? 'accent' : template, logo: null, photo: null })
      return { canvas, url: canvas.toDataURL('image/jpeg', 0.8) }
    }
  }, [days, images, template, accent, period, company, promo.site_url])

  const text = useMemo(() => {
    if (!days || !days.length) return ''
    const lines = [`${t('Свободные окна')} ${period}:`]
    for (const day of days) {
      if (count > 1) lines.push('', `${day.date.slice(8, 10)}.${day.date.slice(5, 7)}:`)
      for (const m of day.masters) lines.push(`${m.name}: ${windowsText(m.windows).replaceAll(' · ', ', ')}`)
    }
    lines.push('', `${t('Запись онлайн')}: ${taggedUrl(promo.site_url, channel)}`)
    return lines.join('\n')
  }, [days, period, count, channel, promo.site_url])

  async function share() {
    if (!story) return
    setBusy(true)
    try {
      const blob = await new Promise(resolve => story.canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error(t('Не удалось создать картинку'))
      const file = new File([blob], 'free-windows.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] })
        } catch { /* закрыли меню «Поделиться» */ }
      } else {
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'free-windows.png'
        link.click()
        setTimeout(() => URL.revokeObjectURL(link.href), 1000)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const canShareFiles = typeof navigator !== 'undefined' && typeof navigator.canShare === 'function'
  return (
    <section className="rounded-2xl p-4 mb-4" style={card}>
      <h2 className="text-ink text-base font-semibold">{t('Поделиться свободными окнами')}</h2>
      <p className="text-gray-500 text-xs mt-1 mb-3">
        {t('Картинка для сторис Instagram и текст для Telegram, Viber и WhatsApp — со ссылкой на запись. Окна считаются по графику и записям: от часа свободного времени.')}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Field label={t('Когда')}>
          <Select value={range} onChange={e => { setDays(null); setRange(e.target.value) }}>
            <option value="today">{t('Сегодня')}</option>
            <option value="tomorrow">{t('Завтра')}</option>
            <option value="week">{t('Неделя')}</option>
          </Select>
        </Field>
        {isManager && promo.masters.length > 1 && (
          <Field label={t('Мастер')}>
            <Select value={master} onChange={e => { setDays(null); setMaster(e.target.value) }}>
              <option value="">{t('Все мастера')}</option>
              {promo.masters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </Field>
        )}
        <Field label={t('Оформление')}>
          <Select value={template} onChange={e => setTemplate(e.target.value)}>
            {TEMPLATES.map(item => <option key={item.id} value={item.id}>{t(item.label)}</option>)}
          </Select>
        </Field>
      </div>
      {template === 'photo' && !company?.main_photo && (
        <p className="text-gray-500 text-xs mt-2">{t('Фото салона не загружено — фон будет тёмным. Загрузить: «О салоне» → «Главное фото салона».')}</p>
      )}
      <ErrorText className="mt-2">{error}</ErrorText>
      {days === null && !error && <div className="py-6 flex justify-center"><Spinner /></div>}
      {days && days.length === 0 && (
        <p className="text-sm mt-4" style={{ color: 'var(--c-muted)' }}>{t('Свободных окон нет — всё занято или нерабочий день.')}</p>
      )}
      {days && days.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-shrink-0">
            {story && (
              <img src={story.url} alt={t('Картинка для сторис')} data-testid="story-preview"
                className="rounded-xl w-48 sm:w-56" style={{ aspectRatio: '9 / 16', border: '1px solid var(--c-line)' }} />
            )}
            <Button variant="primary" className="w-full mt-2" onClick={share} disabled={busy || !story}>
              {canShareFiles ? t('Поделиться картинкой') : t('Скачать картинку')}
            </Button>
          </div>
          <div className="flex-1 min-w-0">
            <Field label={t('Текст со ссылкой')}>
              <TextArea value={text} readOnly rows={8} />
            </Field>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Select value={channel} onChange={e => setChannel(e.target.value)} className="w-auto" aria-label={t('Куда')}>
                {TEXT_CHANNELS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
              </Select>
              <CopyButton text={text} label={t('Скопировать текст')} />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function MasterLink({ master, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [slug, setSlug] = useState(master.link_slug)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    setError(null)
    try {
      onSaved(await saveMasterLink(master.id, slug.trim().toLowerCase()))
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="py-3" style={{ borderTop: '1px solid var(--c-line)' }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-ink text-sm font-medium">{master.name}</div>
          <div className="text-xs wrap-anywhere" style={{ color: 'var(--c-muted)' }}>{master.url}</div>
        </div>
        <div className="flex gap-2">
          <CopyButton text={master.url} />
          {!editing && <Button onClick={() => { setSlug(master.link_slug); setEditing(true) }}>{t('Изменить')}</Button>}
        </div>
      </div>
      {editing && (
        <div className="mt-2">
          <div className="flex gap-2">
            <TextInput value={slug} onChange={e => setSlug(e.target.value)} placeholder="anna" aria-label={t('Окончание ссылки')} />
            <Button variant="primary" onClick={save} disabled={busy}>{t('Сохранить')}</Button>
            <Button onClick={() => setEditing(false)} disabled={busy}>{t('Отменить')}</Button>
          </div>
          <p className="text-gray-500 text-xs mt-1">{t('Латинские буквы, цифры и дефис. Пусто — ссылка по номеру мастера.')}</p>
          <ErrorText className="mt-1">{error}</ErrorText>
        </div>
      )}
    </li>
  )
}

function Sources({ promo, onPeriod }) {
  const rows = Object.entries(promo.sources || {}).sort((a, b) => b[1] - a[1])
  const total = rows.reduce((sum, [, n]) => sum + n, 0)
  const max = rows.length ? rows[0][1] : 0
  return (
    <section className="rounded-2xl p-4 mb-4" style={card}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-ink text-base font-semibold">{t('Откуда приходят записи')}</h2>
        <Select value={promo.days} onChange={e => onPeriod(Number(e.target.value))} className="w-auto" aria-label={t('Период')}>
          <option value={7}>{t('7 дней')}</option>
          <option value={30}>{t('30 дней')}</option>
          <option value={90}>{t('90 дней')}</option>
        </Select>
      </div>
      {total === 0 && <p className="text-sm mt-3" style={{ color: 'var(--c-muted)' }}>{t('За этот период записей нет.')}</p>}
      {total > 0 && (
        <ul className="mt-3 space-y-2">
          {rows.map(([source, n]) => (
            <li key={source}>
              <div className="flex justify-between text-sm">
                <span className="text-ink">{t(SOURCE_LABELS[source] || source)}</span>
                <span className="text-ink font-medium">{n}</span>
              </div>
              <div className="h-2 rounded-full mt-1" style={{ backgroundColor: 'var(--c-raised)' }}>
                <div className="h-2 rounded-full" style={{ width: `${Math.max(4, (n / max) * 100)}%`, backgroundColor: 'var(--accent)' }} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-gray-500 text-xs mt-3">
        {t('Считаются записи, созданные за период (без отменённых). Источник видно по ссылке: ставьте ссылки с метками ниже — тогда будет понятно, что работает.')}
      </p>
    </section>
  )
}

export default function PromoPage() {
  const { me, isManager } = useStaffAuth()
  const [promo, setPromo] = useState(null)
  const [company, setCompany] = useState(null)
  const [days, setDays] = useState(30)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchPromo(days)
      .then(data => { if (!cancelled) { setPromo(data); setError(null) } })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [days])

  useEffect(() => {
    fetchStaffCompany().then(setCompany).catch(() => setCompany({}))
  }, [])

  const accent = me?.company?.booking_accent || DEFAULT_ACCENT
  if (!promo || !company) {
    return (
      <div className="px-4 md:px-6 py-5 max-w-3xl">
        <PageHeader title={t('Привлечение')} />
        {error ? <ErrorText>{error}</ErrorText> : <div className="py-10 flex justify-center"><Spinner /></div>}
      </div>
    )
  }

  const updateMaster = saved => setPromo(prev => ({ ...prev, masters: prev.masters.map(m => (m.id === saved.id ? { ...m, ...saved } : m)) }))
  const siteLinks = [
    { from: 'instagram', label: t('Для шапки профиля Instagram') },
    { from: 'stories', label: t('Для сторис') },
    { from: 'telegram', label: t('Для Telegram-канала') },
    { from: 'qr', label: t('Для QR-кода на ресепшене') },
  ]
  return (
    <div className="px-4 md:px-6 py-5 max-w-3xl">
      <PageHeader title={t('Привлечение')} subtitle={t('Свободные окна для сторис, ссылки и откуда приходят клиенты')} />
      {!promo.enabled && (
        <p className="text-sm rounded-xl px-3 py-2 mb-4" style={{ backgroundColor: 'var(--c-card)', color: 'var(--c-muted)' }}>
          {t('Раздел выключен. Включить: «Настройки» → «Правила записи» → «Привлечение клиентов».')}
        </p>
      )}
      <WindowsShare promo={promo} company={company} accent={accent} />
      {promo.masters.length > 0 && (
        <section className="rounded-2xl p-4 mb-4" style={card}>
          <h2 className="text-ink text-base font-semibold">{isManager ? t('Ссылки мастеров') : t('Моя ссылка')}</h2>
          <p className="text-gray-500 text-xs mt-1">
            {t('Ссылка сразу открывает запись к мастеру. Поставьте её в Instagram мастера — записи по ней видно в статистике как «Ссылка мастера».')}
          </p>
          <ul className="mt-2">
            {promo.masters.map(m => <MasterLink key={m.id} master={m} onSaved={updateMaster} />)}
          </ul>
        </section>
      )}
      {isManager && (
        <section className="rounded-2xl p-4 mb-4" style={card}>
          <h2 className="text-ink text-base font-semibold">{t('Ссылки салона с метками')}</h2>
          <ul className="mt-2">
            {siteLinks.map(link => {
              const url = taggedUrl(promo.site_url, link.from)
              return (
                <li key={link.from} className="py-3 flex flex-wrap items-center justify-between gap-2" style={{ borderTop: '1px solid var(--c-line)' }}>
                  <div className="min-w-0">
                    <div className="text-ink text-sm">{link.label}</div>
                    <div className="text-xs wrap-anywhere" style={{ color: 'var(--c-muted)' }}>{url}</div>
                  </div>
                  <CopyButton text={url} />
                </li>
              )
            })}
          </ul>
        </section>
      )}
      {promo.sources && <Sources promo={promo} onPeriod={setDays} />}
    </div>
  )
}
