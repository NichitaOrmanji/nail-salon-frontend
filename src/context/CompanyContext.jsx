import { createContext, useContext, useState, useEffect } from 'react'
import { fetchCompany } from '../api/company'
import { SLUG } from '../api/client'
import { t } from '../i18n'
import { applyBookingAccent, clearAppearance } from '../utils/appearance'
// Картинки JC — из сборки: имя с хэшем, кэш браузера на год
import jcLogo from '../assets/jc-logo.webp'
import jcSalon from '../assets/jc-salon.webp'

// Показываем, пока /info/ не ответил (или если бэк недоступен). Картинки JC — только для JC:
// у других салонов вместо пустого логотипа — буква названия, вместо фото — градиент
const FALLBACK = SLUG === 'jcnails'
  ? {
    name: 'JC nails',
    address: 'Bulevardul Moscova, 1/2',
    phone: '+373 671 380-96',
    logo: jcLogo,
    main_photo: jcSalon,
    latitude: 47.0447862,
    longitude: 28.8607939,
    description: '',
  }
  : { name: '', address: '', phone: '', logo: null, main_photo: null, latitude: null, longitude: null, description: '' }

const CompanyContext = createContext(FALLBACK)

// Салона с таким адресом нет или он ещё не открыл запись (не подтвердил email) — вместо пустой главной
function SalonNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: '#1a1a1a' }}>
      <h1 className="text-white text-xl font-bold mb-2">{t('Салон не найден')}</h1>
      <p className="text-gray-400 text-sm max-w-xs">
        {t('Проверьте ссылку. Если салон только что зарегистрировался, онлайн-запись откроется после подтверждения его email.')}
      </p>
    </div>
  )
}

export function CompanyProvider({ children }) {
  const [company, setCompany] = useState(FALLBACK)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetchCompany()
      .then(data => {
        if (!data || typeof data !== 'object') return
        // Пустые поля с бэка не затирают запасные значения
        const filled = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== null && v !== ''))
        setCompany(c => ({ ...c, ...filled }))
        if (filled.name) document.title = filled.name
      })
      .catch(err => { if (err?.status === 404) setNotFound(true) })
  }, [])

  // Цвет кнопок и выбранных дат — тот, что выбрал владелец салона
  const bookingAccent = company.booking_accent
  useEffect(() => {
    applyBookingAccent(bookingAccent)
    return () => clearAppearance()
  }, [bookingAccent])

  if (notFound) return <SalonNotFound />

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
