import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { checkSlug, fetchSignupConfig, signup } from '../api/signup'
import { useStaffAuth } from '../context/StaffAuthContext'
import AuthCard from '../components/AuthCard'
import { Button, ErrorText, Field, TextInput } from '../components/ui'
import Spinner from '../../components/layout/Spinner'

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

// Регистрация салона: название, адрес сайта, email, пароль → сразу в панель
export default function SignupPage() {
  const { me, signIn } = useStaffAuth()
  const [config, setConfig] = useState(null)
  const [configError, setConfigError] = useState(null)
  const [form, setForm] = useState({ salon_name: '', email: '', password: '', phone: '', accept_terms: false })
  // Адрес: пока владелец его не правил — из названия (подсказка сервера), потом — свой
  const [customSlug, setCustomSlug] = useState(null)
  const [error, setError] = useState(null)
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
    return <Navigate to="/admin-panel/settings" replace state={created ? { welcome: true, emailSent: created.emailSent } : undefined} />
  }

  function set(field, value) {
    setError(null)
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
        website: honeypotRef.current?.value || '' })
      setCreated({ emailSent: data.email_sent })
      await signIn(data)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  if (configError) {
    return <AuthCard title="Регистрация салона"><ErrorText className="text-center">{configError}</ErrorText></AuthCard>
  }
  if (!config) {
    return <AuthCard title="Регистрация салона"><Spinner /></AuthCard>
  }
  if (!config.signup) {
    return (
      <AuthCard title="Регистрация салона" subtitle="TimePoint — онлайн-запись для салонов">
        <p className="text-gray-300 text-sm text-center">Регистрация новых салонов скоро откроется.</p>
        <Link to="/admin-panel/login" className="block text-center text-sm underline" style={{ color: '#f472b6' }}>Вход для салонов</Link>
      </AuthCard>
    )
  }

  const preview = config.salon_url_template.replace('{slug}', slug || 'adres')

  return (
    <AuthCard title="Регистрация салона" wide onSubmit={handleSubmit}
      subtitle={`Онлайн-запись для вашего салона · ${config.trial_days} дней бесплатно`}>
      <Field label="Название салона" hint="Так его увидят клиенты">
        <TextInput value={form.salon_name} onChange={e => set('salon_name', e.target.value)} maxLength={200} autoFocus />
      </Field>

      <Field label="Адрес сайта записи" hint="Латинские буквы, цифры и дефис">
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
          ? <div style={{ color: '#34d399' }}>✓ Адрес свободен</div>
          : (
            <div style={{ color: '#f87171' }}>
              {slugState.error}
              {slugState.suggestion && (
                <button type="button" className="ml-1 underline" style={{ color: '#f472b6' }}
                  onClick={() => setCustomSlug(slugState.suggestion)}>
                  Взять {slugState.suggestion}
                </button>
              )}
            </div>
          ))}
      </div>

      <Field label="Email" hint="Для входа и восстановления пароля. Придёт письмо для подтверждения">
        <TextInput type="email" autoComplete="email" autoCapitalize="none" value={form.email}
          onChange={e => set('email', e.target.value)} maxLength={150} />
      </Field>
      <Field label="Пароль" hint="Не короче 8 символов, не только цифры">
        <TextInput type="password" autoComplete="new-password" value={form.password}
          onChange={e => set('password', e.target.value)} maxLength={128} />
      </Field>
      <Field label="Телефон салона (необязательно)">
        <TextInput type="tel" autoComplete="tel" value={form.phone} onChange={e => set('phone', e.target.value)} maxLength={30} />
      </Field>

      {/* Ловушка для ботов: скрыта от людей и экранных дикторов */}
      <input ref={honeypotRef} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
        className="absolute -left-[9999px] w-px h-px opacity-0" defaultValue="" />

      <label className="flex items-start gap-3 cursor-pointer select-none">
        <input type="checkbox" className="mt-0.5 w-5 h-5 flex-shrink-0 accent-pink-500" checked={form.accept_terms}
          onChange={e => set('accept_terms', e.target.checked)} />
        <span className="text-gray-400 text-xs leading-relaxed">
          Принимаю{' '}
          <Link to="/admin-panel/terms" target="_blank" className="underline" style={{ color: '#f472b6' }}>условия сервиса</Link>
          {' '}и обязуюсь обрабатывать данные своих клиентов по закону о защите персональных данных
        </span>
      </label>

      <ErrorText className="text-center">{error}</ErrorText>
      <Button type="submit" variant="primary" className="w-full" disabled={!canSubmit}>
        {busy ? 'Создаём салон...' : 'Создать салон'}
      </Button>
      <p className="text-center text-gray-500 text-xs">
        Уже зарегистрированы? <Link to="/admin-panel/login" className="underline" style={{ color: '#f472b6' }}>Войти</Link>
      </p>
    </AuthCard>
  )
}
