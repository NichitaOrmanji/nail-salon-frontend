import { useNavigate } from 'react-router-dom'
import { t } from '../i18n'

function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: '#1a1a1a' }}>

      <div className="text-center mb-10">
        <p className="font-bold mb-4" style={{ fontSize: '80px', color: '#242424' }}>404</p>
        <h1 className="text-white text-2xl font-bold mb-2 tracking-tight">{t('Страница не найдена')}</h1>
        <p className="text-gray-500 text-sm">{t('Такой страницы не существует или она была удалена')}</p>
      </div>

      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-semibold transition-all active:scale-95"
        style={{ backgroundColor: '#f472b6' }}
      >
        <IconHome />
        {t('На главную')}
      </button>

    </div>
  )
}