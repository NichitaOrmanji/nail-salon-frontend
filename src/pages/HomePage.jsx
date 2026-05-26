import { useNavigate } from 'react-router-dom'
import { useBooking } from '../context/BookingContext'

export default function HomePage() {
  const navigate = useNavigate()
  const { reset } = useBooking()

  function handleNavigate(path) {
    reset()
    navigate(path)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a1a1a' }}>

      {/* Фото салона */}
      <div className="relative h-48 bg-gray-700">
        <img
          src="https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800"
          alt="Салон"
          className="w-full h-full object-cover"
        />
        {/* Иконка профиля */}
        <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
          <span className="text-white text-lg">👤</span>
        </button>
      </div>

      {/* Карточка салона */}
      <div className="rounded-t-3xl -mt-6 relative" style={{ backgroundColor: '#1a1a1a' }}>
        <div className="px-6 pt-6 pb-4">

          {/* Логотип + название */}
          <div className="flex items-center gap-3 mb-1">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl">
              💅
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">Название салона</h1>
              <p className="text-gray-400 text-sm">ул. Пушкина, 1</p>
            </div>
          </div>

        </div>

        {/* Кнопки навигации */}
        <div className="px-4 pb-8 space-y-3">

          <button
            onClick={() => handleNavigate('/masters')}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl"
            style={{ backgroundColor: '#2a2a2a' }}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">👥</span>
              <span className="text-white text-base">Выбрать специалиста</span>
            </div>
            <span className="text-gray-400">›</span>
          </button>

          <button
            onClick={() => handleNavigate('/slots')}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl"
            style={{ backgroundColor: '#2a2a2a' }}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">📅</span>
              <span className="text-white text-base">Выбрать дату и время</span>
            </div>
            <span className="text-gray-400">›</span>
          </button>

          <button
            onClick={() => handleNavigate('/services')}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl"
            style={{ backgroundColor: '#2a2a2a' }}
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">📋</span>
              <span className="text-white text-base">Выбрать услуги</span>
            </div>
            <span className="text-gray-400">›</span>
          </button>

        </div>
      </div>

    </div>
  )
}