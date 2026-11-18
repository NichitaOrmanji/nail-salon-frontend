import { useCallback, useEffect, useState } from 'react'
import Modal from './Modal'
import { Button, ErrorText } from './ui'
import { createTelegramLink, disconnectTelegram, fetchTelegramStatus, updateTelegramSettings } from '../api/telegram'
import { useStaffAuth } from '../context/StaffAuthContext'
import { t } from '../../i18n'

// Пока открыта ссылка на бота — проверяем, подключился ли Telegram
const POLL_MS = 3000

// Что присылать, кроме новых записей и отмен
function NotifyToggle({ checked, title, hint, disabled, onChange }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" className="mt-1 w-4 h-4 accent-pink-500" checked={checked} disabled={disabled}
        onChange={e => onChange(e.target.checked)} />
      <span>
        <span className="block text-ink text-sm">{title}</span>
        <span className="block text-gray-500 text-xs mt-0.5">{hint}</span>
      </span>
    </label>
  )
}

export default function TelegramModal({ onClose }) {
  const { me } = useStaffAuth()
  const [status, setStatus] = useState(null)
  const [link, setLink] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(() => (
    fetchTelegramStatus().then(setStatus).catch(err => setError(err.message))
  ), [])

  useEffect(() => {
    let cancelled = false
    fetchTelegramStatus()
      .then(data => { if (!cancelled) setStatus(data) })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!link || status?.connected) return
    const timer = setInterval(refresh, POLL_MS)
    return () => clearInterval(timer)
  }, [link, status?.connected, refresh])

  async function handleConnect() {
    setError(null)
    setBusy(true)
    try {
      setLink(await createTelegramLink())
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDisconnect() {
    setError(null)
    setBusy(true)
    try {
      await disconnectTelegram()
      setLink(null)
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function toggle(field, value) {
    setError(null)
    setBusy(true)
    try {
      setStatus(await updateTelegramSettings({ [field]: value }))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  let body
  if (!status) {
    body = <p className="text-gray-400 text-sm">{error ? '' : t('Загружаем...')}</p>
  } else if (!status.available) {
    body = <p className="text-gray-400 text-sm">{t('Telegram-бот салона пока не настроен.')}</p>
  } else if (status.connected) {
    body = (
      <div className="space-y-4">
        <p className="text-ink text-sm">{t('✅ Telegram подключён. Сюда приходят новые записи и отмены клиентами.')}</p>
        <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor: 'var(--c-card)', border: '1px solid var(--c-line)' }}>
          {me?.master_id && (
            <NotifyToggle checked={status.remind_before} disabled={busy} onChange={value => toggle('remind_before', value)}
              title={t('Напоминать за час до клиента')} hint={t('Имя, услуга и телефон клиента')} />
          )}
          <NotifyToggle checked={status.daily_summary} disabled={busy} onChange={value => toggle('daily_summary', value)}
            title={t('Список записей на завтра')}
            hint={me?.master_id ? t('Каждый вечер в 20:00, если завтра есть записи') : t('Каждый вечер в 20:00 — записи салона на завтра')} />
        </div>
        <Button variant="danger" onClick={handleDisconnect} disabled={busy}>{t('Отключить')}</Button>
      </div>
    )
  } else if (link) {
    body = (
      <div className="space-y-4">
        <p className="text-gray-300 text-sm">
          {t('Откройте бота и нажмите «Старт» (Start). Ссылка действует 15 минут.')}
        </p>
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="min-h-[44px] px-4 rounded-xl text-sm font-medium inline-flex items-center justify-center text-white"
          style={{ backgroundColor: '#1479a8' }}
        >
          {t('Открыть Telegram')}
        </a>
        <p className="text-gray-500 text-xs">{t('Ждём подключения...')}</p>
      </div>
    )
  } else {
    body = (
      <div className="space-y-4">
        <p className="text-gray-300 text-sm">
          {t('Получайте в Telegram новые записи и отмены клиентами. Подключается для вашего аккаунта.')}
        </p>
        <Button variant="primary" onClick={handleConnect} disabled={busy}>
          {busy ? t('Готовим ссылку...') : t('Подключить Telegram')}
        </Button>
      </div>
    )
  }

  return (
    <Modal title={t('Уведомления в Telegram')} onClose={onClose} footer={<Button onClick={onClose}>{t('Закрыть')}</Button>}>
      {body}
      <ErrorText className="mt-3">{error}</ErrorText>
    </Modal>
  )
}
