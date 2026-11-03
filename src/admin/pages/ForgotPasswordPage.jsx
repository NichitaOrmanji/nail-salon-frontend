import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../api/signup'
import AuthCard from '../components/AuthCard'
import { Button, ErrorText, Field, TextInput } from '../components/ui'

// «Забыли пароль?» — ссылка для нового пароля на email
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      setMessage((await requestPasswordReset(email.trim())).message)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard title="Восстановление пароля" subtitle="Пришлём ссылку для нового пароля" onSubmit={handleSubmit}>
      {message ? (
        <p className="text-sm text-center" style={{ color: 'var(--success-text)' }}>{message}. Проверьте и папку «Спам».</p>
      ) : (
        <>
          <Field label="Email, указанный при регистрации">
            <TextInput type="email" autoComplete="email" autoCapitalize="none" value={email}
              onChange={e => setEmail(e.target.value)} autoFocus />
          </Field>
          <ErrorText className="text-center">{error}</ErrorText>
          <Button type="submit" variant="primary" className="w-full" disabled={!email.trim() || busy}>
            {busy ? 'Отправляем...' : 'Отправить ссылку'}
          </Button>
          <p className="text-gray-500 text-xs text-center">
            Мастер или администратор без email — попросите владельца салона сменить пароль в карточке мастера.
          </p>
        </>
      )}
      <Link to="/admin-panel/login" className="block text-center text-sm underline" style={{ color: 'var(--accent-text)' }}>Ко входу</Link>
    </AuthCard>
  )
}
