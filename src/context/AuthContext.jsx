import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, register as apiRegister } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)

  // При запуске приложения проверяем — есть ли токен в localStorage
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    setIsLoggedIn(!!token)
    setLoading(false)
  }, [])

  // Вход
  async function login(phone, password) {
    const data = await apiLogin(phone, password)
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    setIsLoggedIn(true)
  }

  // Регистрация
  async function register(phone, password) {
    const data = await apiRegister(phone, password)
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    setIsLoggedIn(true)
  }

  // Выход
  function logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setIsLoggedIn(false)
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}