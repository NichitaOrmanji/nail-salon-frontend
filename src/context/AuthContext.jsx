import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, register as apiRegister, fetchMe } from '../api/auth'

const AuthContext = createContext(null)

function saveTokens(data) {
  localStorage.setItem('access_token', data.access)
  localStorage.setItem('refresh_token', data.refresh)
}

export function AuthProvider({ children }) {
  // При запуске приложения проверяем — есть ли токен в localStorage
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('access_token'))

  // api/client.js сообщает, что токен устарел
  useEffect(() => {
    const onLogout = () => setIsLoggedIn(false)
    window.addEventListener('auth:logout', onLogout)
    return () => window.removeEventListener('auth:logout', onLogout)
  }, [])

  // Вход
  async function login(phone, password) {
    saveTokens(await apiLogin(phone, password))
    localStorage.setItem('client_phone', phone)
    setIsLoggedIn(true)
    // Имя для формы записи берём из профиля; если не вышло — не страшно
    try {
      const me = await fetchMe()
      const name = [me?.name, me?.surname].filter(Boolean).join(' ')
      if (name) localStorage.setItem('client_name', name)
    } catch { /* без имени тоже можно войти */ }
  }

  // Регистрация
  async function register({ phone, password, name, surname }) {
    saveTokens(await apiRegister({ phone, password, name, surname }))
    localStorage.setItem('client_phone', phone)
    localStorage.setItem('client_name', [name, surname].filter(Boolean).join(' '))
    setIsLoggedIn(true)
  }

  // Выход
  function logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setIsLoggedIn(false)
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
