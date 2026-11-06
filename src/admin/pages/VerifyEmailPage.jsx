import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '../api/signup'
import { getStaffAccessToken } from '../api/staffClient'
import { useStaffAuth } from '../context/StaffAuthContext'
import AuthCard from '../components/AuthCard'
import { ErrorText } from '../components/ui'
import Spinner from '../../components/layout/Spinner'
import { t } from '../../i18n'

// Ссылка из письма: подтверждаем email — сайт записи салона становится виден клиентам
export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const { me, refreshMe } = useStaffAuth()
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return
    sent.current = true
    verifyEmail(params.get('token') || '')
      .then(data => {
        setResult(data)
        // Владелец вошёл в панель — обновляем статус салона (баннер «подтвердите email» исчезнет).
        // Данные о входе могли загрузиться раньше подтверждения, поэтому — всегда, если есть вход
        if (getStaffAccessToken()) refreshMe().catch(() => {})
      })
      .catch(err => setError(err.message))
  }, [params, refreshMe])

  return (
    <AuthCard title={t('Подтверждение email')}>
      {!result && !error && <Spinner />}
      <ErrorText className="text-center">{error}</ErrorText>
      {result && (
        <div className="space-y-3 text-center">
          <p className="text-sm" style={{ color: '#34d399' }}>{t('✓ Email подтверждён. Сайт записи открыт для клиентов:')}</p>
          <a href={result.public_url} target="_blank" rel="noreferrer" className="block text-sm underline break-all" style={{ color: '#f472b6' }}>
            {result.public_url}
          </a>
        </div>
      )}
      {(result || error) && (
        <Link to={me ? '/admin-panel/settings' : '/admin-panel/login'} className="block text-center text-sm underline" style={{ color: '#f472b6' }}>
          {me ? t('Продолжить настройку') : t('Войти в панель')}
        </Link>
      )}
    </AuthCard>
  )
}
