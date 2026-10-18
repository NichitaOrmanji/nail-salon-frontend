import { createContext, useContext, useState, useEffect } from 'react'
import { fetchCompany } from '../api/company'

// Показываем, пока /info/ не ответил (или если бэк недоступен)
const FALLBACK = {
  name: 'JC nails',
  address: 'Bulevardul Moscova, 1/2',
  phone: '+373 671 380-96',
  logo: '/SALON.logo.png',
  main_photo: '/salon.jpg',
  latitude: 47.0447862,
  longitude: 28.8607939,
  description: ''
}

const CompanyContext = createContext(FALLBACK)

export function CompanyProvider({ children }) {
  const [company, setCompany] = useState(FALLBACK)

  useEffect(() => {
    fetchCompany()
      .then(data => {
        // Пустые поля с бэка не затирают запасные значения
        const filled = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== null && v !== ''))
        setCompany(c => ({ ...c, ...filled }))
      })
      .catch(() => {})
  }, [])

  return (
    <CompanyContext.Provider value={company}>
      {children}
    </CompanyContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCompany() {
  return useContext(CompanyContext)
}
