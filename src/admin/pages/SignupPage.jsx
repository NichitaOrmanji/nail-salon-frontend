import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { checkSlug, fetchSignupConfig, signup } from '../api/signup'
import { useStaffAuth } from '../context/StaffAuthContext'
import AuthCard from '../components/AuthCard'
import { Button, ErrorText, Field, Select, TextInput } from '../components/ui'
import Spinner from '../../components/layout/Spinner'
import { t } from '../../i18n'

// Проверка адреса на сервере (с паузой после ввода): по самому адресу или по названию салона
// → { slug, available, error, suggestion }; null — ещё не проверен
function useSlugCheck(query) {
  const [state, setState] = useState(null)
  const key = JSON.stringify(query)
  useEffect(() => {
    if (!query.slug && !query.name) return undefined
    let alive = true
    const timer = setTimeout(() => {
      checkSlug(query)
        .then(result => { if (alive) setState({ ...result, key }) })
        .catch(() => { if (alive) setState(null) })
    }, 350)
    return () => { alive = false; clearTimeout(timer) }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps -- query описан key
  // Пока идёт новая проверка — прежний ответ (поле адреса не мигает при наборе названия)
  return state
}

// Поля, ошибки которых сервер возвращает отдельно и мы показываем под самим полем
const FIELD_ERRORS = ['salon_name', 'email', 'password', 'phone', 'specialization', 'district']

// Соло-мастер: услуги по специализации появятся сразу (их можно поменять)
const SPECIALIZATIONS = [
  { id: 'manicure', label: 'Маникюр и педикюр' },
  { id: 'brows', label: 'Брови' },
  { id: 'lashes', label: 'Ресницы' },
  { id: 'hair', label: 'Парикмахер' },
  { id: 'massage', label: 'Массаж' },
  { id: 'other', label: 'Другое' },
]

// Регистрация салона: название, адрес сайта, email, пароль → сразу в панель
export default function SignupPage() {
  const { me, signIn } = useStaffAuth()
  const [searchParams] = useSearchParams()
  // «Я салон / студия» или «Я мастер, работаю сам» (?kind=solo — со страницы мастера)
  const [kind, setKind] = useState(searchParams.get('kind') === 'solo' ? 'solo' : 'salon')
  const [solo, setSolo] = useState({ specialization: 'manicure', district: '' })
  const [config, setConfig] = useState(null)
  const [configError, setConfigError] = useState(null)
  const [form, setForm] = useState({ salon_name: '', email: '', password: '', phone: '', accept_terms: false })
  // Адрес: пока владелец его не правил — из названия (подсказка сервера), потом — свой
  const [customSlug, setCustomSlug] = useState(null)
  const [error, setError] = useState(null)
  // Ошибки сервера по полям: { password: '…', email: '…' } — показываем под полем
  const [fieldErrors, setFieldErrors] = useState({})
  const [busy, setBusy] = useState(false)
  // Салон создан: { emailSent } — после входа «Начало работы» покажет приветствие
  const [created, setCreated] = useState(null)
  const honeypotRef = useRef(null)
  const slugState = useSlugCheck(customSlug !== null ? { slug: customSlug } : { name: form.salon_name.trim() })
  const slug = customSlug !== null ? customSlug : (slugState?.slug || '')

  useEffect(() => {
    fetchSignupConfig().then(setConfig).catch(err => setConfigError(err.message))
  }, [])

  if (me) {
    return <Navigate to="/admin-panel/salon" replace state={created ? { welcome: true, emailSent: created.emailSent } : undefined} />
  }

  function set(field, value) {
    setError(null)
    setFieldErrors(errors => ({ ...errors, [field]: null }))
    setForm(f => ({ ...f, [field]: value }))
  }

  const slugOk = Boolean(slugState?.available) && slugState.slug === slug
  const canSubmit = form.salon_name.trim() && slug && form.email.trim() && form.password && form.accept_terms && !busy

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setBusy(true)
    setError(null)
    try {
      const data = await signup({ ...form, slug, salon_name: form.salon_name.trim(), email: form.email.trim(),
        website: honeypotRef.current?.value || '',
        ...(kind === 'solo' ? { kind, specialization: solo.specialization, district: solo.district.trim() } : {}) })
      setCreated({ emailSent: data.email_sent })
      await signIn(data)
    } catch (err) {
      const byField = {}
      for (const field of FIELD_ERRORS) {
        const value = err.data?.[field]
        const text = Array.isArray(value) ? value[0] : value
        if (typeof text === 'string') byField[field] = text
      }
      setFieldErrors(byField)
      setError(Object.keys(byField).length ? null : err.message)
      setBusy(false)
    }
  }

  if (configError) {
    return <AuthCard title={t('Регистрация салона')}><ErrorText className="text-center">{configError}</ErrorText></AuthCard>
  }
  if (!config) {
    return <AuthCard title={t('Регистрация салона')}><Spinner /></AuthCard>
  }
  if (!config.signup) {
    return (
      <AuthCard title={t('Регистрация салона')} subtitle={t('TimePoint — онлайн-запись для салонов')}>
        <p className="text-gray-300 text-sm text-center">{t('Регистрация новых салонов скоро откроется.')}</p>
        <Link to="/admin-panel/login" className="block text-center text-sm underline" style={{ color: 'var(--accent-ink)' }}>{t('Вход для салонов')}</Link>
      </AuthCard>
    )
  }

  const preview = config.salon_url_template.replace('{slug}', slug || 'adres')
  const isSolo = kind === 'solo'

  return (
    <AuthCard title={isSolo ? t('Регистрация мастера') : t('Регистрация салона')} wide onSubmit={handleSubmit}
      subtitle={isSolo
        ? t('Своя страница записи, журнал и клиенты · {trial_days} дней бесплатно', { trial_days: config.trial_days })
        : t('Онлайн-запись для вашего салона · {trial_days} дней бесплатно', { trial_days: config.trial_days })}>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('Кто регистрируется')}>
        {[['salon', t('Я салон / студия')], ['solo', t('Я мастер, работаю сам')]].map(([value, label]) => (
          <button key={value} type="button" role="radio" aria-checked={kind === value} onClick={() => setKind(value)}
            className="min-h-[48px] px-3 rounded-2xl text-sm font-medium"
            style={kind === value
              ? { backgroundColor: 'var(--accent)', color: '#fff' }
              : { backgroundColor: 'var(--c-raised)', color: 'var(--c-ink)', border: '1px solid var(--c-line)' }}>
            {label}
          </button>
        ))}
      </div>
      <Field label={isSolo ? t('Ваше имя и фамилия') : t('Название салона')}
        hint={isSolo ? t('Так вас увидят клиенты на странице записи') : t('Так его увидят клиенты')} error={fieldErrors.salon_name}>
        <TextInput value={form.salon_name} onChange={e => set('salon_name', e.target.value)} maxLength={200} autoFocus />
      </Field>
      {isSolo && (
        <>
          <Field label={t('Специализация')} hint={t('Сразу добавим типовые услуги — цены и длительность поменяете')} error={fieldErrors.specialization}>
            <Select value={solo.specialization} onChange={e => setSolo(s => ({ ...s, specialization: e.target.value }))}>
              {SPECIALIZATIONS.map(item => <option key={item.id} value={item.id}>{t(item.label)}</option>)}
            </Select>
          </Field>
          <Field label={t('Район (необязательно)')} hint={t('Клиенты увидят только район, точный адрес — после записи')} error={fieldErrors.district}>
            <TextInput value={solo.district} onChange={e => setSolo(s => ({ ...s, district: e.target.value }))} maxLength={100}
              placeholder={t('Например: Ботаника')} />
          </Field>
        </>
      )}

      <Field label={t('Адрес сайта записи')} hint={t('Латинские буквы, цифры и дефис')}>
        <TextInput
          value={slug}
          autoCapitalize="none"
          maxLength={30}
          onChange={e => { setError(null); setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')) }}
          aria-describedby="slug-status"
        />
      </Field>
      <div id="slug-status" className="-mt-2 text-xs break-all" aria-live="polite">
        <div className="text-gray-400">{preview}</div>
        {slug && slugState?.slug === slug && (slugOk
          ? <div style={{ color: 'var(--c-ok)' }}>{t('✓ Адрес свободен')}</div>
          : (
            <div style={{ color: 'var(--c-danger)' }}>
              {slugState.error}
              {slugState.suggestion && (
                <button type="button" className="ml-1 underline" style={{ color: 'var(--accent-ink)' }}
                  onClick={() => setCustomSlug(slugState.suggestion)}>
                  {t('Взять {suggestion}', { suggestion: slugState.suggestion })}
                </button>
              )}
            </div>
          ))}
      </div>

      <Field label="Email" hint={t('Для входа и восстановления пароля. Придёт письмо для подтверждения')} error={fieldErrors.email}>
        <TextInput type="email" autoComplete="email" autoCapitalize="none" value={form.email}
          onChange={e => set('email', e.target.value)} maxLength={150} />
      </Field>
      <Field label={t('Пароль')} hint={t('Не короче 8 символов, не только цифры, не похож на адрес почты')} error={fieldErrors.password}>
        <TextInput type="password" autoComplete="new-password" value={form.password}
          onChange={e => set('password', e.target.value)} maxLength={128} />
      </Field>
      <Field label={isSolo ? t('Телефон (необязательно)') : t('Телефон салона (необязательно)')} error={fieldErrors.phone}>
        <TextInput type="tel" autoComplete="tel" value={form.phone} onChange={e => set('phone', e.target.value)} maxLength={30} />
      </Field>

      {/* Ловушка для ботов: скрыта от людей и экранных дикторов */}
      <input ref={honeypotRef} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
        className="absolute -left-[9999px] w-px h-px opacity-0" defaultValue="" />

      <label className="flex items-start gap-3 cursor-pointer select-none">
        <input type="checkbox" className="mt-0.5 w-5 h-5 flex-shrink-0 accent-pink-500" checked={form.accept_terms}
          onChange={e => set('accept_terms', e.target.checked)} />
        <span className="text-gray-400 text-xs leading-relaxed">
          {t('Принимаю')}{' '}
          <Link to="/admin-panel/terms" target="_blank" className="underline" style={{ color: 'var(--accent-ink)' }}>{t('условия сервиса')}</Link>
          {' '}{t('и обязуюсь обрабатывать данные своих клиентов по закону о защите персональных данных')}
        </span>
      </label>

      <ErrorText className="text-center">{error}</ErrorText>
      <Button type="submit" variant="primary" className="w-full" disabled={!canSubmit}>
        {busy ? (isSolo ? t('Создаём страницу...') : t('Создаём салон...')) : (isSolo ? t('Создать страницу') : t('Создать салон'))}
      </Button>
      <p className="text-center text-gray-500 text-xs">
        {t('Уже зарегистрированы?')}{' '}<Link to="/admin-panel/login" className="underline" style={{ color: 'var(--accent-ink)' }}>{t('Войти')}</Link>
      </p>
    </AuthCard>
  )
}
