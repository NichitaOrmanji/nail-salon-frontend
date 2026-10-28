import { useState } from 'react'
import { telegramLoginStart, telegramLoginVerify } from '../api/auth'
import { t } from '../i18n'

const TELEGRAM_BLUE = '#229ED9'

// Вход без пароля: бот просит поделиться номером и присылает код, код вводится здесь
export default function TelegramLogin({ onTokens }) {
  const [attempt, setAttempt] = useState(null) // { token, url }
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function begin() {
    setError(null)
    setBusy(true)
    try {
      setAttempt(await telegramLoginStart())
      setCode('')
    } catch (err) {
      setError(err.message || t('Вход через Telegram сейчас недоступен'))
    } finally {
      setBusy(false)
    }
  }

  async function verify() {
    if (code.length !== 6 || busy) return
    setError(null)
    setBusy(true)
    try {
      await onTokens(await telegramLoginVerify(attempt.token, code))
    } catch (err) {
      setError(err.message || t('Не получилось войти'))
      setBusy(false)
    }
  }

  if (!attempt) {
    return (
      <div className="mb-6">
        <button
          onClick={begin}
          disabled={busy}
          className="w-full py-4 rounded-2xl text-white font-semibold transition-all active:scale-95"
          style={{ backgroundColor: TELEGRAM_BLUE, opacity: busy ? 0.6 : 1 }}
        >
          {busy ? t('Подождите...') : t('Войти через Telegram')}
        </button>
        <p className="text-gray-500 text-xs text-center mt-2">{t('Без пароля: подтвердим номер в Telegram')}</p>
        {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}
      </div>
    )
  }

  return (
    <div className="mb-6 rounded-2xl p-4 space-y-3" style={{ backgroundColor: '#242424' }}>
      <ol className="text-gray-300 text-sm space-y-1 list-decimal pl-5">
        <li>{t('Откройте бота и нажмите «Старт».')}</li>
        <li>{t('Нажмите «📱 Поделиться номером».')}</li>
        <li>{t('Введите код, который пришлёт бот.')}</li>
      </ol>
      <a
        href={attempt.url}
        target="_blank"
        rel="noreferrer"
        className="block w-full py-3 rounded-xl text-white text-sm font-semibold text-center"
        style={{ backgroundColor: TELEGRAM_BLUE }}
      >
        {t('Открыть Telegram')}
      </a>
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder={t('Код из Telegram')}
        aria-label={t('Код из Telegram')}
        value={code}
        onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        onKeyDown={e => e.key === 'Enter' && verify()}
        className="w-full px-4 py-3 rounded-xl text-white text-center text-lg tracking-[0.4em] outline-none placeholder-gray-600 placeholder:tracking-normal placeholder:text-sm"
        style={{ backgroundColor: '#1a1a1a' }}
      />
      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      <button
        onClick={verify}
        disabled={code.length !== 6 || busy}
        className="w-full py-3 rounded-xl text-white font-semibold transition-all active:scale-95"
        style={{ backgroundColor: '#f472b6', opacity: code.length === 6 && !busy ? 1 : 0.4 }}
      >
        {busy ? t('Проверяем...') : t('Подтвердить код')}
      </button>
      <button onClick={begin} disabled={busy} className="w-full text-gray-500 text-xs py-1">
        {t('Получить новую ссылку')}
      </button>
    </div>
  )
}
