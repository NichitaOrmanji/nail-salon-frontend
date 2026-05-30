import { useNavigate } from 'react-router-dom'
import { useBooking } from '../context/BookingContext'

function IconUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function IconChevron() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  )
}

function IconMasters() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}

function IconServices() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const { reset } = useBooking()

  function handleNavigate(path) {
    reset()
    navigate(path)
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
      <div className="relative h-52">
        <img
          src="https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800"
          alt="Салон"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 50%, #1a1a1a 100%)' }} />

        {/* Кнопка профиля */}
        <button
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <span className="text-white"><IconUser /></span>
        </button>
      </div>

      {/* Контент */}
      <div className="px-6 -mt-4 relative">

        {/* Название салона */}
        <div className="mb-8">
          <h1 className="text-white text-2xl font-bold tracking-tight">Название салона</h1>
          <p className="text-gray-500 text-sm mt-1">ул. Пушкина, 1</p>
        </div>

        {/* Заголовок секции */}
        <p className="text-gray-500 text-xs uppercase tracking-widest mb-3 font-medium">Запись онлайн</p>

        {/* Кнопки навигации */}
        <div className="space-y-2">
          {menuItems.map(item => (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all active:scale-95"
              style={{ backgroundColor: '#242424' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#2e2e2e', color: '#f472b6' }}>
                  {item.icon}
                </div>
                <div className="text-left">
                  <div className="text-white text-sm font-medium">{item.label}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{item.sub}</div>
                </div>
              </div>
              <span className="text-gray-600 flex-shrink-0"><IconChevron /></span>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}