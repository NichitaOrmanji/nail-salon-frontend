import { createContext, useContext, useState, useEffect } from 'react'
import { fetchCompany } from '../api/company'
import { SLUG } from '../api/client'

// Показываем, пока /info/ не ответил (или если бэк недоступен). Картинки JC — только для JC:
// у других салонов вместо пустого логотипа — буква названия, вместо фото — градиент
const FALLBACK = SLUG === 'jcnails'
  ? {
    name: 'JC nails',
    address: 'Bulevardul Moscova, 1/2',
    phone: '+373 671 380-96',
    logo: '/SALON.logo.png',
    main_photo: '/salon.jpg',
    latitude: 47.0447862,
    longitude: 28.8607939,
    description: '',
  }
  : { name: '', address: '', phone: '', logo: null, main_photo: null, latitude: null, longitude: null, description: '' }

const CompanyContext = createContext(FALLBACK)

export function CompanyProvider({ children }) {
  const [company, setCompany] = useState(FALLBACK)

  useEffect(() => {
    fetchCompany()
      .then(data => {
        if (!data || typeof data !== 'object') return
        // Пустые поля с бэка не затирают запасные значения
        const filled = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== null && v !== ''))
        setCompany(c => ({ ...c, ...filled }))
        if (filled.name) document.title = filled.name
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
