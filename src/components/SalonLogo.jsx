import { useState } from 'react'

// Логотип салона; нет картинки или не загрузилась — первая буква названия
export default function SalonLogo({ salon, className = '', textClass = 'text-2xl' }) {
  const [failed, setFailed] = useState(false)
  if (salon.logo && !failed) {
    return <img src={salon.logo} alt={salon.name || 'Logo'} className={`w-full h-full object-cover ${className}`} onError={() => setFailed(true)} />
  }
  return (
    <span className={`w-full h-full flex items-center justify-center font-bold text-white ${textClass}`}
      style={{ background: 'linear-gradient(135deg, #f472b6, #a855f7)' }}>
      {(salon.name || '·').trim().charAt(0).toUpperCase()}
    </span>
  )
}
