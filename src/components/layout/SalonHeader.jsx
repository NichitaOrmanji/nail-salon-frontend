import { useNavigate } from 'react-router-dom'
import { useCompany } from '../../context/CompanyContext'

function IconBack() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  )
}

// Шапка шагов записи: кнопка «назад» + название и адрес салона
export default function SalonHeader() {
  const navigate = useNavigate()
  const company = useCompany()

  return (
    <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: '#242424' }}>
      <button
        onClick={() => navigate(-1)}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 transition-all active:scale-90"
        style={{ backgroundColor: '#242424' }}
      >
        <IconBack />
      </button>
      <div className="flex-1">
        <div className="text-white text-sm font-semibold">{company.name}</div>
        <div className="text-gray-500 text-xs">{company.address}</div>
      </div>
    </div>
  )
}
