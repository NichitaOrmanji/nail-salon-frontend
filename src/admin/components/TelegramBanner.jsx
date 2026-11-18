import { useEffect, useState } from 'react'
import { fetchTelegramStatus } from '../api/telegram'
import { Button } from './ui'
import TelegramModal from './TelegramModal'
import { t } from '../../i18n'

const HIDE_KEY = 'admin_tg_banner_hidden'

function readHidden() {
  try {
    return localStorage.getItem(HIDE_KEY) === '1'
  } catch {
    return false
  }
}

// Мастеру: «Подключите Telegram» над журналом, пока бот не подключён (можно скрыть на этом устройстве)
export default function TelegramBanner({ me }) {
  const [hidden, setHidden] = useState(readHidden)
  const [show, setShow] = useState(false)
  const [open, setOpen] = useState(false)
  const isMaster = !!me?.master_id

  useEffect(() => {
    if (!isMaster || hidden) return
    let cancelled = false
    fetchTelegramStatus()
      .then(data => { if (!cancelled) setShow(data.available && !data.connected) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [isMaster, hidden])

  function hide() {
    try { localStorage.setItem(HIDE_KEY, '1') } catch { /* недоступно */ }
    setHidden(true)
  }

  if (!isMaster || hidden || (!show && !open)) return null

  return (
    <>
      {show && (
        <div className="flex flex-wrap items-center gap-3 px-4 md:px-6 py-3"
          style={{ backgroundColor: 'var(--accent-soft)', borderBottom: '1px solid var(--c-line)' }}>
          <div className="flex-1 min-w-[200px]">
            <div className="text-ink text-sm font-semibold">{t('Подключите Telegram')}</div>
            <div className="text-gray-400 text-xs mt-0.5">
              {t('Новые онлайн-записи, напоминание за час до клиента и список на завтра — прямо в телефон.')}
            </div>
          </div>
          <Button variant="primary" onClick={() => setOpen(true)}>{t('Подключить')}</Button>
          <Button onClick={hide}>{t('Позже')}</Button>
        </div>
      )}
      {open && (
        <TelegramModal onClose={() => {
          setOpen(false)
          fetchTelegramStatus().then(data => setShow(data.available && !data.connected)).catch(() => {})
        }} />
      )}
    </>
  )
}
