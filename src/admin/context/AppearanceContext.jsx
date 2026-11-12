import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useStaffAuth } from './StaffAuthContext'
import { updateStaffAppearance } from '../api/auth'
import {
  applyAdminAppearance, clearAppearance, cleanAppearance, readCachedAppearance, cacheAppearance,
} from '../../utils/appearance'

const AppearanceContext = createContext(null)

// Тема и акцент панели. Своё у каждого сотрудника (хранится в профиле на сервере),
// копия в браузере — чтобы при следующем открытии не мелькала чужая тема
export function AppearanceProvider({ children }) {
  const { me, replaceMe } = useStaffAuth()
  const [value, setValue] = useState(readCachedAppearance)
  const impersonated = !!me?.impersonated_by

  // Пришёл профиль (вход, обновление) — берём оформление оттуда
  const serverKey = me?.appearance ? `${me.id}:${me.appearance.theme}:${me.appearance.accent}` : ''
  const [prevKey, setPrevKey] = useState('')
  if (serverKey && serverKey !== prevKey) {
    setPrevKey(serverKey)
    setValue(cleanAppearance(me.appearance))
  }

  useEffect(() => {
    if (serverKey && !impersonated) cacheAppearance(value)
  }, [serverKey, impersonated, value])

  useEffect(() => {
    applyAdminAppearance(value)
    if (value.theme !== 'system') return
    // «Как в системе»: телефон переключился на ночь — панель следом
    const media = window.matchMedia?.('(prefers-color-scheme: light)')
    const onChange = () => applyAdminAppearance(value)
    media?.addEventListener?.('change', onChange)
    return () => media?.removeEventListener?.('change', onChange)
  }, [value])

  // Ушли из панели (на сайт записи, в супер-админку) — там своё оформление
  useEffect(() => () => clearAppearance(), [])

  // Меняется сразу; на сервер — если это не вход поддержки от имени сотрудника
  const save = useCallback(async patch => {
    const prev = value
    const next = cleanAppearance({ ...value, ...patch })
    setValue(next)
    if (impersonated) return { local: true }
    try {
      const data = await updateStaffAppearance(next)
      if (data) {
        setPrevKey(`${data.id}:${data.appearance?.theme}:${data.appearance?.accent}`)
        replaceMe(data)
      }
      return { local: false }
    } catch (err) {
      setValue(prev)
      throw err
    }
  }, [value, impersonated, replaceMe])

  return (
    <AppearanceContext.Provider value={{ ...value, save, impersonated }}>
      {children}
    </AppearanceContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppearance() {
  const context = useContext(AppearanceContext)
  if (!context) throw new Error('useAppearance must be used within AppearanceProvider')
  return context
}
