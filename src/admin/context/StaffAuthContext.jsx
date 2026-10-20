import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { staffLogin, fetchStaffMe } from '../api/auth'
import { getStaffAccessToken, saveStaffTokens, clearStaffTokens } from '../api/staffClient'
import { isManagerRole } from '../utils/statuses'

const StaffAuthContext = createContext(null)

export function StaffAuthProvider({ children }) {
  const [me, setMe] = useState(null)
  // При старте с токеном сначала спрашиваем /me/
  const [loading, setLoading] = useState(() => !!getStaffAccessToken())
  // Почему вышли из панели (истекла сессия, нет доступа) — показывается на странице входа
  const [logoutMessage, setLogoutMessage] = useState(null)
  // /me/ не ответил (нет сети, ошибка сервера) — токен есть, но кто мы, неизвестно
  const [meError, setMeError] = useState(null)

  // GET /me/; 401/403 уже обработал staffClient (событие staff:logout),
  // а при сетевой ошибке или 5xx запоминаем текст, чтобы дать повторить
  const loadMe = useCallback(() => {
    return fetchStaffMe().then(
      data => {
        setMe(data)
        setMeError(null)
        return data
      },
      err => {
        // sessionEnded — из панели уже вышли, пока шёл запрос
        if (!err.sessionEnded && (!err.status || err.status >= 500)) setMeError(err.message)
        throw err
      }
    )
  }, [])

  useEffect(() => {
    if (!getStaffAccessToken()) return
    loadMe()
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [loadMe])

  // staffClient сообщает, что токен не обновился или доступа больше нет
  useEffect(() => {
    const onLogout = e => {
      setMe(null)
      setMeError(null)
      setLogoutMessage(e.detail?.message || null)
    }
    window.addEventListener('staff:logout', onLogout)
    return () => window.removeEventListener('staff:logout', onLogout)
  }, [])

  async function login(username, password) {
    const data = await staffLogin(username, password)
    saveStaffTokens(data)
    setLogoutMessage(null)
    if (data.me) {
      setMe(data.me)
    } else {
      await loadMe()
    }
  }

  function logout() {
    clearStaffTokens()
    setLogoutMessage(null)
    setMeError(null)
    setMe(null)
  }

  const isManager = isManagerRole(me?.role)

  return (
    <StaffAuthContext.Provider value={{ me, loading, meError, login, logout, refreshMe: loadMe, isManager, logoutMessage }}>
      {children}
    </StaffAuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStaffAuth() {
  const context = useContext(StaffAuthContext)
  if (!context) {
    throw new Error('useStaffAuth must be used within StaffAuthProvider')
  }
  return context
}
