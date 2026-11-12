import { useEffect, useState } from 'react'
import { BrandLockup } from '../../components/BrandMark'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { fetchSignupConfig } from '../api/signup'
import { useStaffAuth } from '../context/StaffAuthContext'
import { Button, Field, TextInput, ErrorText } from '../components/ui'
import { t } from '../../i18n'

export default function LoginPage() {
  const { me, login, logoutMessage } = useStaffAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  // «Забыли пароль?» и «Создать салон» — только если на сервере настроена почта / открыта регистрация
  const [config, setConfig] = useState(null)

  useEffect(() => {
    fetchSignupConfig().then(setConfig).catch(() => {})
  }, [])

  // Возвращаем туда, откуда выкинуло (только внутри панели)
  const from = typeof location.state?.from === 'string' && location.state.from.startsWith('/admin-panel')
    && !location.state.from.startsWith('/admin-panel/login')
    ? location.state.from
    : '/admin-panel'

  if (me) return <Navigate to={from} replace />

  const canSubmit = username.trim() && password && !loading

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setLoading(true)
    try {
      await login(username.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || t('Не удалось войти'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-10" style={{ backgroundColor: 'var(--c-bg)' }}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{ backgroundColor: 'var(--c-surface)', border: '1px solid var(--c-line)' }}
      >
        <div className="flex flex-col items-center mb-2">
          {/* Панель общая для всех салонов — знак TimePoint, без логотипа конкретного салона */}
          <BrandLockup />
          <h1 className="text-ink text-xl font-bold">{t('Панель салона')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('Вход для персонала · TimePoint')}</p>
        </div>

        <Field label={t('Логин, email или телефон')}>
          <TextInput
            autoComplete="username"
            autoCapitalize="none"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </Field>
        <Field label={t('Пароль')}>
          <TextInput
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </Field>

        <ErrorText className="text-center">{error || logoutMessage}</ErrorText>

        <Button type="submit" variant="primary" className="w-full" disabled={!canSubmit}>
          {loading ? t('Входим...') : t('Войти')}
        </Button>

        {config?.password_reset && (
          <Link to="/admin-panel/forgot-password" className="block text-center text-sm underline" style={{ color: 'var(--accent-ink)' }}>
            {t('Забыли пароль?')}
          </Link>
        )}
        {config?.signup && (
          <p className="text-center text-gray-400 text-sm">
            {t('Новый салон?')}{' '}<Link to="/admin-panel/signup" className="underline" style={{ color: 'var(--accent-ink)' }}>{t('Создать за 2 минуты')}</Link>
          </p>
        )}
        <a href="/" className="block text-center text-gray-500 text-xs py-2">{t('Сайт записи ↗')}</a>
      </form>
    </div>
  )
}
