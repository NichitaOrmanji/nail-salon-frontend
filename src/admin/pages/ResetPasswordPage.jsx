import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { confirmPasswordReset } from '../api/signup'
import AuthCard from '../components/AuthCard'
import { Button, ErrorText, Field, TextInput } from '../components/ui'

// Ссылка из письма «Сброс пароля»: новый пароль
export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [done, setDone] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (busy) return
    if (password !== repeat) { setError('Пароли не совпадают'); return }
    setBusy(true)
    setError(null)
    try {
      setDone(await confirmPasswordReset({ uid: params.get('uid') || '', token: params.get('token') || '', password }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard title="Новый пароль" onSubmit={done ? undefined : handleSubmit}>
      {done ? (
        <p className="text-sm text-center" style={{ color: 'var(--success-text)' }}>
          Пароль изменён. Войдите с новым паролем (логин: {done.username}).
        </p>
      ) : (
        <>
          <Field label="Новый пароль" hint="Не короче 8 символов, не только цифры">
            <TextInput type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} autoFocus />
          </Field>
          <Field label="Повторите пароль">
            <TextInput type="password" autoComplete="new-password" value={repeat} onChange={e => setRepeat(e.target.value)} />
          </Field>
          <ErrorText className="text-center">{error}</ErrorText>
          <Button type="submit" variant="primary" className="w-full" disabled={!password || !repeat || busy}>
            {busy ? 'Сохраняем...' : 'Сохранить пароль'}
          </Button>
        </>
      )}
      <Link to="/admin-panel/login" className="block text-center text-sm underline" style={{ color: 'var(--accent-text)' }}>
        {done ? 'Войти' : 'Ко входу'}
      </Link>
      {error && !done && (
        <Link to="/admin-panel/forgot-password" className="block text-center text-xs underline text-gray-400">Запросить новую ссылку</Link>
      )}
    </AuthCard>
  )
}
