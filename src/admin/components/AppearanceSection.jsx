import { useState, useRef, useEffect } from 'react'
import { useStaffAuth } from '../context/StaffAuthContext'
import { useAppearance } from '../context/AppearanceContext'
import { updateStaffCompany } from '../api/company'
import { ACCENT_PRESETS, DEFAULT_ACCENT, accentShades, applyAdminAppearance, normalizeHex } from '../../utils/appearance'
import { t } from '../../i18n'
import { Button } from './ui'

const THEME_OPTIONS = [
  { key: 'dark', label: 'Тёмная', bg: '#111111', side: '#1a1a1a', card: '#242424', line: '#2e2e2e' },
  { key: 'light', label: 'Светлая', bg: '#F4F4F5', side: '#18181B', card: '#FFFFFF', line: '#D4D4D8' },
  { key: 'system', label: 'Как в системе', split: true },
]

// Мини-превью темы: меню слева, карточка и кнопка акцентом
function ThemePreview({ option, accent }) {
  if (option.split) {
    return (
      <span className="flex h-16 rounded-lg overflow-hidden" aria-hidden="true">
        <span className="flex-1"><ThemePreview option={THEME_OPTIONS[0]} accent={accent} /></span>
        <span className="flex-1"><ThemePreview option={THEME_OPTIONS[1]} accent={accent} /></span>
      </span>
    )
  }
  return (
    <span className="flex h-16 rounded-lg overflow-hidden" style={{ backgroundColor: option.bg }} aria-hidden="true">
      <span className="w-1/4" style={{ backgroundColor: option.side }} />
      <span className="flex-1 p-1.5 flex flex-col gap-1">
        <span className="h-3 rounded" style={{ backgroundColor: option.card, border: `1px solid ${option.line}` }} />
        <span className="h-3 rounded" style={{ backgroundColor: option.card, border: `1px solid ${option.line}` }} />
        <span className="h-3 w-1/2 rounded" style={{ backgroundColor: accent }} />
      </span>
    </span>
  )
}

// Кружки цветов + свой цвет (палитра и поле #RRGGBB)
function ColorPicker({ value, onChange, labelledBy, idPrefix }) {
  const current = normalizeHex(value) || DEFAULT_ACCENT
  const [text, setText] = useState(current)
  const [prev, setPrev] = useState(current)
  if (current !== prev) {
    setPrev(current)
    setText(current)
  }
  const custom = !ACCENT_PRESETS.some(p => p.hex === current)
  function commitText() {
    const hex = normalizeHex(text.startsWith('#') ? text : `#${text}`)
    if (hex) onChange(hex)
    else setText(current)
  }
  return (
    <div>
      <div role="radiogroup" aria-labelledby={labelledBy} className="flex flex-wrap gap-2">
        {ACCENT_PRESETS.map(p => (
          <button
            key={p.hex}
            type="button"
            role="radio"
            aria-checked={current === p.hex}
            aria-label={t(p.name)}
            title={t(p.name)}
            onClick={() => onChange(p.hex)}
            className="w-11 h-11 rounded-full flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
            style={{
              backgroundColor: p.hex,
              boxShadow: current === p.hex ? '0 0 0 2px var(--c-card), 0 0 0 4px var(--c-ink)' : 'inset 0 0 0 1px rgba(0, 0, 0, 0.15)',
            }}
          >
            {current === p.hex && <span className="text-white text-base font-bold" aria-hidden="true">✓</span>}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <label className="relative w-11 h-11 rounded-full overflow-hidden cursor-pointer flex-shrink-0"
          title={t('Свой цвет')}
          style={{
            background: custom ? current : 'conic-gradient(#ef4444, #f59e0b, #22c55e, #06b6d4, #6366f1, #d946ef, #ef4444)',
            boxShadow: custom ? '0 0 0 2px var(--c-card), 0 0 0 4px var(--c-ink)' : 'none',
          }}>
          <span className="sr-only">{t('Свой цвет')}</span>
          <input
            type="color"
            value={current.toLowerCase()}
            onChange={e => onChange(normalizeHex(e.target.value))}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
        <label htmlFor={`${idPrefix}-hex`} className="text-gray-400 text-xs">{t('Свой цвет')}</label>
        <input
          id={`${idPrefix}-hex`}
          value={text}
          maxLength={7}
          spellCheck={false}
          autoComplete="off"
          onChange={e => setText(e.target.value.trim())}
          onBlur={commitText}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitText() } }}
          className="w-28 min-h-[44px] px-3 rounded-xl text-ink text-sm font-mono uppercase outline-none focus:ring-1 focus:ring-pink-400"
          style={{ backgroundColor: 'var(--c-raised)', border: '1px solid var(--c-line)' }}
        />
      </div>
      {custom && accentShades(current).changed && (
        <p className="text-xs mt-2" style={{ color: 'var(--c-warn)' }}>
          {t('Цвет светлый — на кнопках он станет чуть темнее, чтобы белый текст читался.')}
        </p>
      )}
    </div>
  )
}

// Задержка сохранения: палитра присылает цвет на каждое движение
function useDebounced(fn, delay) {
  const timer = useRef(null)
  const latest = useRef(fn)
  useEffect(() => { latest.current = fn })
  useEffect(() => () => clearTimeout(timer.current), [])
  return value => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => latest.current(value), delay)
  }
}

function MyAppearance() {
  const { theme, accent, save, impersonated } = useAppearance()
  const [status, setStatus] = useState(null)
  // Цвет, который сейчас крутят в палитре: виден сразу, сохраняется, когда перестал меняться
  const [draft, setDraft] = useState(null)
  const current = draft || accent || DEFAULT_ACCENT

  async function apply(patch) {
    setStatus(null)
    try {
      const result = await save(patch)
      setStatus(result.local ? 'local' : 'saved')
    } catch (err) {
      setStatus(err?.message || t('Не удалось сохранить'))
    }
  }
  const saveAccent = useDebounced(hex => apply({ accent: hex === DEFAULT_ACCENT ? '' : hex }).finally(() => setDraft(null)), 350)

  return (
    <div>
      <h3 id="theme-title" className="text-ink text-sm font-semibold mb-2">{t('Тема панели')}</h3>
      <div role="radiogroup" aria-labelledby="theme-title" className="grid grid-cols-3 gap-2">
        {THEME_OPTIONS.map(o => (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={theme === o.key}
            onClick={() => apply({ theme: o.key })}
            className="rounded-xl p-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
            style={{ backgroundColor: 'var(--c-raised)', border: `${theme === o.key ? 2 : 1}px solid ${theme === o.key ? 'var(--accent-ink)' : 'var(--c-line)'}` }}
          >
            <ThemePreview option={o} accent={current} />
            <span className="block text-ink text-sm font-medium mt-2">{t(o.label)}</span>
          </button>
        ))}
      </div>

      <h3 id="accent-title" className="text-ink text-sm font-semibold mt-5 mb-1">{t('Акцентный цвет')}</h3>
      <p className="text-gray-400 text-xs mb-3">{t('Кнопки, выбранные вкладки и выделение. Цвета статусов записей не меняются.')}</p>
      <ColorPicker
        value={current}
        labelledBy="accent-title"
        idPrefix="my-accent"
        onChange={hex => {
          if (!hex) return
          setDraft(hex)
          applyAdminAppearance({ theme, accent: hex })
          saveAccent(hex)
        }}
      />
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <span className="min-h-[40px] px-4 rounded-xl text-sm font-semibold inline-flex items-center" style={{ backgroundColor: 'var(--accent)', color: '#ffffff' }}>{t('Кнопка')}</span>
        <span className="min-h-[40px] px-4 rounded-xl text-sm font-semibold inline-flex items-center" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-ink)' }}>{t('Выбрано')}</span>
        <span className="text-sm font-semibold" style={{ color: 'var(--accent-ink)' }}>{t('Ссылка')}</span>
        {accent && (
          <Button variant="ghost" onClick={() => apply({ accent: '' })}>{t('Вернуть розовый')}</Button>
        )}
      </div>
      <p role="status" className="text-xs mt-3 min-h-[1rem]" style={{ color: status && status !== 'saved' && status !== 'local' ? 'var(--c-danger)' : 'var(--c-faint)' }}>
        {status === 'saved' && t('Сохранено — только для вас, у коллег своё оформление.')}
        {status === 'local' && t('Вход от имени сотрудника: оформление меняется только в этом окне и не сохраняется.')}
        {status && status !== 'saved' && status !== 'local' && status}
        {!status && impersonated && t('Вход от имени сотрудника: оформление меняется только в этом окне и не сохраняется.')}
      </p>
    </div>
  )
}

// Мини-превью сайта записи (он всегда тёмный)
function BookingPreview({ hex }) {
  const s = accentShades(hex).dark
  return (
    <div className="rounded-xl p-3 mt-3" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e' }} aria-hidden="true">
      <div className="text-xs mb-2" style={{ color: '#9ca3af' }}>{t('Так увидят клиенты')}</div>
      <div className="flex flex-wrap items-center gap-2">
        {['10:00', '10:30', '11:00'].map((time, i) => (
          <span key={time} className="min-h-[36px] px-3 rounded-xl text-sm inline-flex items-center"
            style={i === 1 ? { backgroundColor: s[''], color: '#ffffff' } : { backgroundColor: '#242424', color: '#d1d5db' }}>
            {time}
          </span>
        ))}
        <span className="text-sm font-medium" style={{ color: s['-ink'] }}>{t('Правила салона')}</span>
      </div>
      <div className="mt-3 min-h-[44px] rounded-xl text-sm font-semibold flex items-center justify-center" style={{ backgroundColor: s[''], color: '#ffffff' }}>
        {t('Записаться')}
      </div>
    </div>
  )
}

function BookingAccent() {
  const { me, replaceMe } = useStaffAuth()
  const { accent } = useAppearance()
  const saved = normalizeHex(me.company?.booking_accent) || DEFAULT_ACCENT
  const [draft, setDraft] = useState(saved)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null)
  const myColor = accent || DEFAULT_ACCENT

  async function submit() {
    setBusy(true)
    setStatus(null)
    try {
      const data = await updateStaffCompany({ booking_accent: draft === DEFAULT_ACCENT ? '' : draft })
      replaceMe(m => ({ ...m, company: { ...m.company, booking_accent: data.booking_accent } }))
      setStatus('saved')
    } catch (err) {
      setStatus(err?.message || t('Не удалось сохранить'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--c-line)' }}>
      <h3 id="booking-accent-title" className="text-ink text-sm font-semibold mb-1">{t('Сайт записи для клиентов')}</h3>
      <p className="text-gray-400 text-xs mb-3">{t('Цвет кнопок и выбранного времени на вашем сайте записи. Меняет только владелец.')}</p>
      <ColorPicker value={draft} onChange={hex => { setDraft(hex); setStatus(null) }} labelledBy="booking-accent-title" idPrefix="booking-accent" />
      <BookingPreview hex={draft} />
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <Button variant="primary" onClick={submit} disabled={busy || draft === saved}>{busy ? t('Сохраняем…') : t('Применить к сайту')}</Button>
        {draft !== myColor && <Button onClick={() => { setDraft(myColor); setStatus(null) }}>{t('Как в моей панели')}</Button>}
      </div>
      <p role="status" className="text-xs mt-2 min-h-[1rem]" style={{ color: status && status !== 'saved' ? 'var(--c-danger)' : 'var(--c-faint)' }}>
        {status === 'saved' ? t('Сохранено — клиенты увидят новый цвет при следующем открытии сайта.') : status}
      </p>
    </div>
  )
}

// Настройки → Оформление: тема и цвет — свои у каждого; цвет сайта записи — у владельца
export default function AppearanceSection() {
  const { me } = useStaffAuth()
  return (
    <section aria-labelledby="appearance-title" className="rounded-2xl p-4 mb-6" style={{ backgroundColor: 'var(--c-card)', border: '1px solid var(--c-line)' }}>
      <h2 id="appearance-title" className="text-ink text-base font-semibold mb-3">{t('Оформление')}</h2>
      <MyAppearance />
      {me.role === 'owner' && <BookingAccent />}
    </section>
  )
}
