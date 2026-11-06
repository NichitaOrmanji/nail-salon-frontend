import { createContext, useContext, useState, useEffect } from 'react'

const BookingContext = createContext(null)

const STORAGE_KEY = 'booking'
// Черновик данных клиента на шаге подтверждения (имя, телефон, комментарий)
export const CONTACT_DRAFT_KEY = 'booking_contact'
// extras — ещё услуги в том же визите (идут подряд после service); visit — части выбранного времени
const EMPTY = { master: null, service: null, extras: [], visit: null, date: null, time: null }
// Сколько услуг можно взять в один визит
export const MAX_VISIT_SERVICES = 5

// Выбор сохраняется в sessionStorage, чтобы не терялся при обновлении страницы
function loadState() {
  try {
    return { ...EMPTY, ...JSON.parse(sessionStorage.getItem(STORAGE_KEY)) }
  } catch {
    return EMPTY
  }
}

export function BookingProvider({ children }) {
  const [state, setState] = useState(loadState)
  const { master, service, date, time } = state
  const extras = state.extras || []
  const visit = state.visit || null

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const setMaster = master => setState(s => ({ ...s, master }))
  const setService = service => setState(s => ({ ...s, service }))
  const setDate = date => setState(s => ({ ...s, date }))
  const setTime = time => setState(s => ({ ...s, time }))
  const setExtras = extras => setState(s => ({ ...s, extras }))
  const setVisit = visit => setState(s => ({ ...s, visit }))

  function reset() {
    setState(EMPTY)
    try { sessionStorage.removeItem(CONTACT_DRAFT_KEY) } catch { /* недоступно */ }
  }

  // Клиент уже что-то выбрал — есть что сохранять при уходе на главную
  const hasProgress = Boolean(service || master || date || time)

  // Логика — куда идти дальше после каждого шага.
  // master === null — мастер ещё не выбран; { id: null } — «Любой специалист»
  function getNextRoute(currentStep) {
    if (currentStep !== 'services' && !service) return '/services'
    if (currentStep !== 'masters' && master === null) return '/masters'
    if (currentStep !== 'slots' && (!date || !time)) return '/slots'
    return '/confirm'
  }

  return (
    <BookingContext.Provider value={{
      master, setMaster,
      service, setService,
      date, setDate,
      time, setTime,
      extras, setExtras,
      visit, setVisit,
      reset,
      hasProgress,
      getNextRoute
    }}>
      {children}
    </BookingContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBooking() {
  return useContext(BookingContext)
}
