import { createContext, useContext, useState } from 'react'

const BookingContext = createContext(null)

export function BookingProvider({ children }) {
  const [master, setMaster] = useState(null)
  const [services, setServices] = useState([])
  const [date, setDate] = useState(null)
  const [time, setTime] = useState(null)

  function reset() {
    setMaster(null)
    setServices([])
    setDate(null)
    setTime(null)
  }

  // Логика — куда идти дальше после каждого шага
  function getNextRoute(currentStep) {
  if (currentStep !== 'services' && services.length === 0) return '/services'
  if (currentStep !== 'masters' && master === null) return '/masters'
  if (currentStep !== 'slots' && (!date || !time)) return '/slots'
  return '/confirm'
}

  return (
    <BookingContext.Provider value={{
      master, setMaster,
      services, setServices,
      date, setDate,
      time, setTime,
      reset,
      getNextRoute
    }}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  return useContext(BookingContext)
}