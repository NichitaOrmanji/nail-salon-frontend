import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button, ErrorText, Field, TextInput } from '../admin/components/ui'
import { saveSuperToken, superLogin, superVerify } from './api'
import BackupCodes from './BackupCodes'

function Card({ title, children }) {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-10" style={{ backgroundColor: '#111111' }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e' }}>
        <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#f472b6' }}>TimePoint · супер-админка</div>
        <h1 className="text-white text-xl font-semibold mb-5">{title}</h1>
        {children}
      </div>
    </div>
  )
}

// QR-код рисуется в браузере (секрет никуда не отправляется)
function QrCode({ url }) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    let alive = true
    import('qrcode')
      .then(mod => (mod.default || mod).toDataURL(url, { margin: 1, width: 220 }))
      .then(data => { if (alive) setSrc(data) })
      .catch(() => {})
    return () => { alive = false }
  }, [url])
  if (!src) return <div className="w-[220px] h-[220px] rounded-xl mx-auto" style={{ backgroundColor: '#242424' }} />
  return <img src={src} alt="QR-код для приложения-аутентификатора" width="220" height="220" className="rounded-xl mx-auto bg-white" />
}

// Вход: логин и пароль → (первый раз) QR-код → код из приложения → резервные коды
export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState('password') // password | setup | code | backup
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [login, setLogin] = useState(null) // ответ шага 1
  const [backupCodes, setBackupCodes] = useState(null)
  const [error, setError] = useState(location.state?.message || null)
  const [busy, setBusy] = useState(false)

  async function submitPassword(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const data = await superLogin(username.trim(), password)
      setPassword('')
      setLogin(data)
      setStep(data.step)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitCode(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const data = await superVerify(login.ticket, code)
      saveSuperToken(data.token)
      if (data.backup_codes) {
        setBackupCodes(data.backup_codes)
        setStep('backup')
      } else {
        navigate('/superadmin', { replace: true })
      }
    } catch (err) {
      setCode('')
      setError(err.message)
      if (err.message.includes('войдите заново')) {
        setLogin(null)
        setStep('password')
      }
    } finally {
      setBusy(false)
    }
  }

  if (step === 'backup') {
    return (
      <Card title="Резервные коды">
        <BackupCodes codes={backupCodes} onDone={() => navigate('/superadmin', { replace: true })} />
      </Card>
    )
  }

  if (step === 'setup' || step === 'code') {
    return (
      <Card title={step === 'setup' ? 'Подключите приложение' : 'Код из приложения'}>
        <form onSubmit={submitCode} className="space-y-4">
          {step === 'setup' && (
            <>
              <p className="text-gray-300 text-sm">
                Установите Google Authenticator, Microsoft Authenticator или другое приложение для кодов,
                отсканируйте QR-код и введите 6 цифр, которые оно покажет.
              </p>
              <QrCode url={login.otpauth_url} />
              <details className="text-sm text-gray-400">
                <summary className="cursor-pointer">Не получается отсканировать?</summary>
                <p className="mt-2">Введите ключ в приложении вручную:</p>
                <code className="block mt-1 break-all rounded-lg px-3 py-2 text-white" style={{ backgroundColor: '#242424' }}>{login.secret}</code>
              </details>
            </>
          )}
          <Field label={step === 'setup' ? 'Код из приложения' : 'Код из приложения или резервный код'}>
            <TextInput
              autoFocus
              value={code}
              onChange={e => setCode(e.target.value)}
              inputMode={step === 'setup' ? 'numeric' : 'text'}
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={12}
            />
          </Field>
          {error && <ErrorText>{error}</ErrorText>}
          <div className="flex gap-2">
            <Button onClick={() => { setStep('password'); setLogin(null); setCode(''); setError(null) }}>Назад</Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={busy || code.trim().length < 6}>
              {busy ? 'Проверяем...' : 'Войти'}
            </Button>
          </div>
        </form>
      </Card>
    )
  }

  return (
    <Card title="Вход">
      <form onSubmit={submitPassword} className="space-y-4">
        <Field label="Логин">
          <TextInput autoFocus value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" />
        </Field>
        <Field label="Пароль">
          <TextInput type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
        </Field>
        {error && <ErrorText>{error}</ErrorText>}
        <Button type="submit" variant="primary" className="w-full" disabled={busy || !username.trim() || !password}>
          {busy ? 'Проверяем...' : 'Дальше'}
        </Button>
      </form>
    </Card>
  )
}
