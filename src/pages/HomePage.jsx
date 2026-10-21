import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBooking } from '../context/BookingContext'
import { useAuth } from '../context/AuthContext'
import { useCompany } from '../context/CompanyContext'
import { PAGE_WIDTH } from '../components/layout/width'
import { formatDisplayDate } from '../utils/format'

// ——— Иконки ———

function IconUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  )
}

function IconChevronDown() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  )
}

function IconClose() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function IconMasters() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

function IconServices() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  )
}

function IconPhone() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.02-.935a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  )
}

function IconPin() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  )
}

// ——— Карта ———

// Координаты с бэка могут быть пустыми или неверными (широта 121) —
// тогда ищем по адресу, а без адреса карту не показываем
function mapQueryFor(salon) {
  const lat = Number(salon.latitude)
  const lng = Number(salon.longitude)
  if (salon.latitude != null && salon.longitude != null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    return `${lat},${lng}`
  }
  return salon.address ? encodeURIComponent(salon.address) : null
}

// ——— Bottom Sheet ———

function SalonInfoSheet({ open, onClose, onBook }) {
  const salon = useCompany()
  const mapQuery = mapQueryFor(salon)

  if (!open) return null

  return (
    <>
      {/* Затемнение */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      />

      {/* Панель */}
      <div
        className={`fixed bottom-0 left-0 right-0 mx-auto w-full ${PAGE_WIDTH} z-50 rounded-t-3xl overflow-y-auto`}
        style={{ backgroundColor: '#1e1e1e', maxHeight: '85vh' }}
      >
        {/* Ручка + крестик */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <div className="w-6" /> {/* spacer */}
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#3a3a3a' }} />
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 transition-all active:scale-90"
            style={{ backgroundColor: '#2e2e2e' }}
          >
            <IconClose />
          </button>
        </div>

        <div className="px-6 pb-32">

          {/* Шапка */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-white flex items-center justify-center">
              <img src={salon.logo} alt="Лого" className="w-full h-full object-cover"
                onError={e => { e.target.style.display = 'none' }} />
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">{salon.name}</h2>
              {salon.description && (
                <p className="text-gray-400 text-sm mt-1">{salon.description}</p>
              )}
            </div>
          </div>

          {/* Адрес */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-gray-500"><IconPin /></span>
            <span className="text-gray-300 text-sm">{salon.address}</span>
          </div>

          {/* Контакты */}
          <p className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-3">Контакты</p>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-gray-500"><IconPhone /></span>
            <a href={`tel:${salon.phone}`} className="text-gray-300 text-sm">{salon.phone}</a>
          </div>

          {/* Карта */}
          {mapQuery && (
            <>
              <p className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-3">Расположение</p>
              <div className="rounded-2xl overflow-hidden mb-3" style={{ height: '180px' }}>
                <iframe
                  src={`https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  title="Карта"
                />
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-sm mb-6"
                style={{ color: '#f472b6' }}
              >
                Открыть в Google Maps ↗
              </a>
            </>
          )}

        </div>

        {/* Кнопка Записаться */}
        <div className={`fixed bottom-0 left-0 right-0 mx-auto w-full ${PAGE_WIDTH} p-4 z-50`} style={{ backgroundColor: '#1e1e1e' }}>
          <button
            onClick={onBook}
            className="w-full py-4 rounded-2xl text-white font-semibold transition-all active:scale-95"
            style={{ backgroundColor: '#f472b6' }}
          >
            Записаться
          </button>
        </div>
      </div>
    </>
  )
}

// ——— Главная страница ———

export default function HomePage() {
  const navigate = useNavigate()
  const { reset, hasProgress, service, master, date, time, getNextRoute } = useBooking()
  const { isLoggedIn } = useAuth()
  const salon = useCompany()
  const [sheetOpen, setSheetOpen] = useState(false)

  function handleNavigate(path) {
    reset()
    navigate(path)
  }

  function handleBook() {
    setSheetOpen(false)
    handleNavigate('/services')
  }

  const menuItems = [
    {
      icon: <IconMasters />,
      label: 'Выбрать специалиста',
      sub: 'Посмотреть мастеров и их работы',
      path: '/masters'
    },
    {
      icon: <IconCalendar />,
      label: 'Выбрать дату и время',
      sub: 'Найти удобный слот',
      path: '/slots'
    },
    {
      icon: <IconServices />,
      label: 'Выбрать услуги',
      sub: 'Маникюр, педикюр и другое',
      path: '/services'
    },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a1a1a' }}>

      {/* Фото салона */}
      <div className="relative h-52 md:h-72">
        <img
          src={salon.main_photo}
          alt="Салон"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 50%, #1a1a1a 100%)' }} />

        <button
          onClick={() => navigate(isLoggedIn ? '/account' : '/profile')}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <span className="text-white"><IconUser /></span>
        </button>
      </div>

      {/* Контент */}
      <div className="px-6 -mt-6 relative">

        {/* Логотип — большой, отдельно */}
        <button
          onClick={() => setSheetOpen(true)}
          className="w-24 h-24 rounded-full overflow-hidden border-4 bg-white flex items-center justify-center mb-4 active:scale-95 transition-all"
          style={{ borderColor: '#1a1a1a' }}
        >
          <img
            src={salon.logo}
            alt="Лого"
            className="w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none' }}
          />
        </button>

        {/* Название + адрес + стрелка */}
        <button
          onClick={() => setSheetOpen(true)}
          className="flex items-center gap-2 mb-8 active:opacity-70 transition-all"
        >
          <div className="text-left">
            <h1 className="text-white text-3xl font-bold tracking-tight">{salon.name}</h1>
            <p className="text-gray-400 text-base mt-1">{salon.address}</p>
          </div>
          <span className="text-gray-400 mt-1 flex-shrink-0"><IconChevronDown /></span>
        </button>

        {/* Заголовок секции */}
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-3 font-medium">Запись онлайн</p>

        {/* Незавершённая запись, сохранённая при выходе на главную */}
        {hasProgress && (
          <button
            onClick={() => navigate(getNextRoute('home'))}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl mb-3 transition-all active:scale-95"
            style={{ backgroundColor: '#2e1f28', border: '1px solid #f472b6' }}
          >
            <div className="text-left">
              <div className="text-white text-base font-medium">Продолжить запись</div>
              <div className="text-gray-400 text-sm mt-0.5">
                {[service?.name, master && (master.id ? master.name : 'Любой специалист'),
                  date && `${formatDisplayDate(date, { withYear: false })}${time ? ` в ${time}` : ''}`]
                  .filter(Boolean).join(' · ')}
              </div>
            </div>
            <span className="flex-shrink-0" style={{ color: '#f472b6' }}><IconChevronRight /></span>
          </button>
        )}

        {/* Кнопки навигации */}
        <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-3">
          {menuItems.map(item => (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className="w-full h-full flex items-center justify-between px-5 py-5 rounded-2xl transition-all active:scale-95"
              style={{ backgroundColor: '#242424' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#2e2e2e', color: '#f472b6' }}>
                  {item.icon}
                </div>
                <div className="text-left">
                  <div className="text-white text-base font-medium">{item.label}</div>
                  <div className="text-gray-500 text-sm mt-0.5">{item.sub}</div>
                </div>
              </div>
              <span className="text-gray-600 flex-shrink-0"><IconChevronRight /></span>
            </button>
          ))}
        </div>

      </div>

      <SalonInfoSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onBook={handleBook}
      />
    </div>
  )
}