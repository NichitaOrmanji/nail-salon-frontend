import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  )
}

function IconPhone() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.02-.935a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  )
}

function IconLock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { login, register } = useAuth()

  const [tab, setTab] = useState('login')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!phone.trim() || !password.trim()) return
    setError(null)
    setLoading(true)

    try {
      if (tab === 'login') {
        await login(phone, password)
      } else {
        await register(phone, password)
      }
      navigate('/')
    } catch (err) {
      setError(err.message || 'Ошибка. Проверьте данные.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a1a1a' }}>

      {/* Шапка */}
      <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: '#242424' }}>
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 transition-all active:scale-90"
          style={{ backgroundColor: '#242424' }}
        >
          <IconBack />
        </button>
        <div className="flex-1">
          <div className="text-white text-sm font-semibold">JC nails</div>
          <div className="text-gray-500 text-xs">Личный кабинет</div>
        </div>
      </div>

      <div className="px-6 py-6">

        {/* Логотип */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-white mb-4">
            <img src="/SALON.logo.png" alt="Лого" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-white text-xl font-bold">JC nails</h1>
        </div>

        {/* Табы */}
        <div className="flex rounded-2xl p-1 mb-6" style={{ backgroundColor: '#242424' }}>
          <button
            onClick={() => { setTab('login'); setError(null) }}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              backgroundColor: tab === 'login' ? '#f472b6' : 'transparent',
              color: tab === 'login' ? '#ffffff' : '#9ca3af'
            }}
          >
            Войти
          </button>
          <button
            onClick={() => { setTab('register'); setError(null) }}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              backgroundColor: tab === 'register' ? '#f472b6' : 'transparent',
              color: tab === 'register' ? '#ffffff' : '#9ca3af'
            }}
          >
            Регистрация
          </button>
        </div>

        {/* Форма */}
        <div className="rounded-2xl overflow-hidden mb-4" style={{ backgroundColor: '#242424' }}>
          <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: '1px solid #2e2e2e' }}>
            <span className="text-gray-500"><IconPhone /></span>
            <input
              type="tel"
              placeholder="+373 ___ __ ___"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-4">
            <span className="text-gray-500"><IconLock /></span>
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none text-sm"
            />
          </div>
        </div>

        {/* Ошибка */}
        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        {/* Кнопка */}
        <button
          onClick={handleSubmit}
          disabled={!phone.trim() || !password.trim() || loading}
          className="w-full py-4 rounded-2xl text-white font-semibold transition-all active:scale-95"
          style={{
            backgroundColor: '#f472b6',
            opacity: phone.trim() && password.trim() && !loading ? 1 : 0.4
          }}
        >
          {loading ? 'Подождите...' : tab === 'login' ? 'Войти' : 'Зарегистрироваться'}
        </button>

      </div>
    </div>
  )
}