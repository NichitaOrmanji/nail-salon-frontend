import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useStaffAuth } from '../context/StaffAuthContext'
import { Button, Field, TextInput, ErrorText } from '../components/ui'

export default function LoginPage() {
  const { me, login, logoutMessage } = useStaffAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

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
      setError(err.message || 'Не удалось войти')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-10" style={{ backgroundColor: '#111111' }}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e' }}
      >
        <div className="flex flex-col items-center mb-2">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-white mb-3">
            <img src="/SALON.logo.png" alt="Лого" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-white text-xl font-bold">Панель салона</h1>
          <p className="text-gray-500 text-sm mt-1">Вход для персонала</p>
        </div>

        <Field label="Логин или телефон">
          <TextInput
            autoComplete="username"
            autoCapitalize="none"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
        </Field>
        <Field label="Пароль">
          <TextInput
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </Field>

        <ErrorText className="text-center">{error || logoutMessage}</ErrorText>

        <Button type="submit" variant="primary" className="w-full" disabled={!canSubmit}>
          {loading ? 'Входим...' : 'Войти'}
        </Button>

        <a href="/" className="block text-center text-gray-500 text-xs py-2">Сайт записи ↗</a>
      </form>
    </div>
  )
}
