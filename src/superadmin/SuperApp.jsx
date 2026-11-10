import { useEffect, useState } from 'react'
import { Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import Spinner from '../components/layout/Spinner'
import { Button, ErrorText, Field, TextInput } from '../admin/components/ui'
import { clearSuperToken, fetchSuperLog, fetchSuperMe, getSuperToken, regenerateBackupCodes, SUPER_LOGIN_PATH } from './api'
import LoginPage from './LoginPage'
import BackupCodes from './BackupCodes'

const ACTIONS = {
  login: 'Вход',
  login_failed: 'Неверный код',
  totp_setup: 'Подключено приложение для кодов',
  totp_reset: 'Сброшен код из приложения',
  backup_codes_regenerated: 'Новые резервные коды',
  password_set: 'Задан пароль',
}

function formatWhen(iso) {
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function Panel({ title, children }) {
  return (
    <section className="rounded-2xl p-5" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e' }}>
      {title && <h2 className="text-white text-base font-semibold mb-4">{title}</h2>}
      {children}
    </section>
  )
}

// Без токена — на вход; токен проверяем запросом /me (401 → выход)
function RequireSuper({ children }) {
  const navigate = useNavigate()
  const [me, setMe] = useState(null)
  const hasToken = !!getSuperToken()

  useEffect(() => {
    if (!hasToken) return
    fetchSuperMe().then(setMe).catch(() => {})
  }, [hasToken])

  useEffect(() => {
    const onLogout = e => navigate(SUPER_LOGIN_PATH, { replace: true, state: { message: e.detail?.message } })
    window.addEventListener('super:logout', onLogout)
    return () => window.removeEventListener('super:logout', onLogout)
  }, [navigate])

  if (!hasToken) return <Navigate to={SUPER_LOGIN_PATH} replace />
  if (!me) return <div className="min-h-dvh flex items-center justify-center"><Spinner /></div>
  return children(me, setMe)
}

const NAV = [
  { to: '/superadmin', label: 'Сводка', end: true },
  { to: '/superadmin/salons', label: 'Салоны' },
  { to: '/superadmin/log', label: 'Журнал действий' },
  { to: '/superadmin/security', label: 'Безопасность' },
]

function Layout({ me }) {
  const navigate = useNavigate()
  function logout() {
    clearSuperToken()
    navigate(SUPER_LOGIN_PATH, { replace: true })
  }
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3"
        style={{ backgroundColor: '#161616', borderBottom: '1px solid #2e2e2e' }}>
        <div className="mr-4">
          <div className="text-white font-semibold">TimePoint</div>
          <div className="text-xs" style={{ color: '#f472b6' }}>супер-админка</div>
        </div>
        <nav className="flex flex-wrap gap-1 order-3 sm:order-none w-full sm:w-auto" aria-label="Разделы">
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className="min-h-[40px] px-3 rounded-xl inline-flex items-center text-sm font-medium"
              style={({ isActive }) => ({ backgroundColor: isActive ? '#2e1f28' : 'transparent', color: isActive ? '#f472b6' : '#d1d5db' })}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-gray-400 text-sm">{me.username}</span>
          <Button onClick={logout}>Выйти</Button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        <Outlet />
      </main>
    </div>
  )
}

function Soon({ title, items }) {
  return (
    <Panel title={title}>
      <p className="text-gray-400 text-sm mb-3">Раздел в разработке. Здесь будет:</p>
      <ul className="list-disc pl-5 text-gray-300 text-sm space-y-1">
        {items.map(item => <li key={item}>{item}</li>)}
      </ul>
    </Panel>
  )
}

function LogPage() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => {
    fetchSuperLog().then(setRows).catch(err => setError(err.message))
  }, [])
  return (
    <Panel title="Журнал действий">
      {error && <ErrorText>{error}</ErrorText>}
      {!rows && !error && <Spinner />}
      {rows && rows.length === 0 && <p className="text-gray-400 text-sm">Пока пусто</p>}
      {rows && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4 font-medium">Когда</th>
                <th className="py-2 pr-4 font-medium">Действие</th>
                <th className="py-2 pr-4 font-medium">Салон</th>
                <th className="py-2 pr-4 font-medium">Кто</th>
                <th className="py-2 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid #2e2e2e' }}>
                  <td className="py-2 pr-4 text-gray-400 whitespace-nowrap">{formatWhen(r.at)}</td>
                  <td className="py-2 pr-4 text-white">
                    {ACTIONS[r.action] || r.action}
                    {r.details?.backup_code && <span className="text-gray-500"> · резервным кодом</span>}
                  </td>
                  <td className="py-2 pr-4 text-gray-300">{r.company ? r.company.name : '—'}</td>
                  <td className="py-2 pr-4 text-gray-300">{r.user || '—'}</td>
                  <td className="py-2 text-gray-500 whitespace-nowrap">{r.ip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}

function SecurityPage({ me, setMe }) {
  const [code, setCode] = useState('')
  const [codes, setCodes] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const data = await regenerateBackupCodes(code)
      setCodes(data.backup_codes)
      setMe({ ...me, backup_codes_left: data.backup_codes.length })
    } catch (err) {
      setError(err.message)
    } finally {
      setCode('')
      setBusy(false)
    }
  }

  return (
    <Panel title="Безопасность">
      <div className="space-y-4 max-w-lg">
        <p className="text-gray-300 text-sm">
          Вход — по паролю и коду из приложения. Сессия длится 4 часа и закрывается вместе с вкладкой.
          Осталось резервных кодов: <span className="text-white font-semibold">{me.backup_codes_left}</span>.
        </p>
        {codes ? (
          <BackupCodes codes={codes} onDone={() => setCodes(null)} doneLabel="Готово" />
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-gray-400 text-sm">Новые резервные коды заменят старые. Для подтверждения введите код из приложения.</p>
            <Field label="Код из приложения">
              <TextInput value={code} onChange={e => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" maxLength={6} />
            </Field>
            {error && <ErrorText>{error}</ErrorText>}
            <Button type="submit" variant="primary" disabled={busy || code.length !== 6}>Выдать новые резервные коды</Button>
          </form>
        )}
        <p className="text-gray-500 text-xs">
          Потеряли телефон и резервные коды — GitHub → Actions → Superadmin → reset-totp: при следующем входе снова покажется QR-код.
        </p>
      </div>
    </Panel>
  )
}

// Супер-админка платформы: /superadmin/*
export default function SuperApp() {
  // Своё название вкладки; поисковикам страница не нужна
  useEffect(() => {
    const title = document.title
    document.title = 'TimePoint — супер-админка'
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow'
    document.head.appendChild(robots)
    return () => {
      document.title = title
      robots.remove()
    }
  }, [])
  return (
    <div className="min-h-dvh text-white" style={{ backgroundColor: '#111111' }}>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route path="*" element={
          <RequireSuper>
            {(me, setMe) => (
              <Routes>
                <Route element={<Layout me={me} />}>
                  <Route index element={<Soon title="Сводка" items={[
                    'Салоны по статусам: пробный период, работают, заблокированы',
                    'Регистрации и записи по дням',
                    'Кончается пробный период, не подтверждён email, давно не заходили',
                  ]} />} />
                  <Route path="salons" element={<Soon title="Салоны" items={[
                    'Список с поиском и фильтрами',
                    'Карточка салона: блокировка, продление пробного периода, письма владельцу, заметки',
                    'Вход в панель салона от имени владельца',
                  ]} />} />
                  <Route path="log" element={<LogPage />} />
                  <Route path="security" element={<SecurityPage me={me} setMe={setMe} />} />
                  <Route path="*" element={<Navigate to="/superadmin" replace />} />
                </Route>
              </Routes>
            )}
          </RequireSuper>
        } />
      </Routes>
    </div>
  )
}
