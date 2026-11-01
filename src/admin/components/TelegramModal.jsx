import { useCallback, useEffect, useState } from 'react'
import Modal from './Modal'
import { Button, ErrorText } from './ui'
import { createTelegramLink, disconnectTelegram, fetchTelegramStatus } from '../api/telegram'

// Пока открыта ссылка на бота — проверяем, подключился ли Telegram
const POLL_MS = 3000

export default function TelegramModal({ onClose }) {
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

  let body
  if (!status) {
    body = <p className="text-gray-400 text-sm">{error ? '' : 'Загружаем...'}</p>
  } else if (!status.available) {
    body = <p className="text-gray-400 text-sm">Telegram-бот салона пока не настроен.</p>
  } else if (status.connected) {
    body = (
      <div className="space-y-4">
        <p className="text-white text-sm">✅ Telegram подключён. Сюда приходят новые записи и отмены клиентами.</p>
        <Button variant="danger" onClick={handleDisconnect} disabled={busy}>Отключить</Button>
      </div>
    )
  } else if (link) {
    body = (
      <div className="space-y-4">
        <p className="text-gray-300 text-sm">
          Откройте бота и нажмите «Старт» (Start). Ссылка действует 15 минут.
        </p>
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="min-h-[44px] px-4 rounded-xl text-sm font-medium inline-flex items-center justify-center text-white"
          style={{ backgroundColor: '#1479a8' }}
        >
          Открыть Telegram
        </a>
        <p className="text-gray-500 text-xs">Ждём подключения...</p>
      </div>
    )
  } else {
    body = (
      <div className="space-y-4">
        <p className="text-gray-300 text-sm">
          Получайте в Telegram новые записи и отмены клиентами. Подключается для вашего аккаунта.
        </p>
        <Button variant="primary" onClick={handleConnect} disabled={busy}>
          {busy ? 'Готовим ссылку...' : 'Подключить Telegram'}
        </Button>
      </div>
    )
  }

  return (
    <Modal title="Уведомления в Telegram" onClose={onClose} footer={<Button onClick={onClose}>Закрыть</Button>}>
      {body}
      <ErrorText className="mt-3">{error}</ErrorText>
    </Modal>
  )
}
