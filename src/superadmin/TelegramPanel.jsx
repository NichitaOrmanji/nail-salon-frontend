import { useEffect, useState } from 'react'
import Spinner from '../components/layout/Spinner'
import { Button, ErrorText } from '../admin/components/ui'
import { fetchSuperTelegram, linkSuperTelegram, testSuperTelegram, unlinkSuperTelegram } from './api'
import { formatWhen } from './common'
import { Panel } from './ui'

const POLL_MS = 3000
const POLL_LIMIT_MS = 15 * 60 * 1000 // ссылка живёт 15 минут

// Тревоги и события платформы в Telegram супер-админа
export default function TelegramPanel() {
  const [info, setInfo] = useState(null)
  const [link, setLink] = useState(null)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchSuperTelegram().then(setInfo).catch(err => setError(err.message))
  }, [])

  // Ждём, пока в боте нажмут «Старт» по ссылке
  useEffect(() => {
    if (!link) return
    const started = Date.now()
    const timer = setInterval(() => {
      if (Date.now() - started > POLL_LIMIT_MS) {
        clearInterval(timer)
        setLink(null)
        return
      }
      fetchSuperTelegram().then(data => {
        if (data.connected) {
          clearInterval(timer)
          setLink(null)
          setInfo(data)
          setNotice('Telegram подключён — в бот пришло сообщение')
        }
      }).catch(() => {})
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [link])

  async function run(action) {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await action()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const connect = () => run(async () => setLink((await linkSuperTelegram()).url))
  const test = () => run(async () => {
    await testSuperTelegram()
    setNotice('Проверочное сообщение отправлено')
  })
  const disconnect = () => run(async () => {
    if (!window.confirm('Отключить тревоги в Telegram?')) return
    await unlinkSuperTelegram()
    setInfo({ ...info, connected: false, linked_at: null })
  })

  return (
    <Panel title="Тревоги в Telegram">
      {!info && !error && <Spinner />}
      {info && (
        <div className="space-y-4 max-w-lg">
          <p className="text-gray-300 text-sm">
            Бот напишет, если перестанут уходить сообщения и напоминания, не пройдёт ночной бэкап или проверка
            его восстановления, встанет очередь Telegram. Пока проблема не исправлена — напоминание раз в 6 часов,
            исправилась — сообщение «Исправилось». Ещё приходят события: новый салон, подтверждение email.
          </p>
          {!info.available && <p className="text-amber-300 text-sm">Telegram-бот на сервере не настроен.</p>}
          {info.available && info.connected && (
            <>
              <p className="text-sm text-white">✓ Подключено{info.linked_at && <span className="text-gray-400"> · {formatWhen(info.linked_at)}</span>}</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" disabled={busy} onClick={test}>Отправить проверку</Button>
                <Button disabled={busy} onClick={connect}>Подключить другой чат</Button>
                <Button disabled={busy} onClick={disconnect}>Отключить</Button>
              </div>
            </>
          )}
          {info.available && !info.connected && !link && (
            <Button variant="primary" disabled={busy} onClick={connect}>Подключить Telegram</Button>
          )}
          {link && (
            <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: '#141414', border: '1px solid #2e2e2e' }}>
              <p className="text-sm text-gray-300">Откройте бота и нажмите «Старт». Ссылка действует 15 минут.</p>
              <a href={link} target="_blank" rel="noopener noreferrer"
                className="min-h-[40px] px-4 rounded-xl inline-flex items-center text-sm font-semibold"
                style={{ backgroundColor: '#ec4899', color: '#ffffff' }}>
                Открыть Telegram
              </a>
              <p className="text-xs text-gray-500">Жду подтверждения от бота…</p>
            </div>
          )}
          {info.open_alerts?.length > 0 && (
            <div className="text-sm">
              <p className="text-gray-400 mb-1">Сейчас открыты тревоги:</p>
              <ul className="list-disc pl-5 space-y-1" style={{ color: '#fecaca' }}>
                {info.open_alerts.map(a => <li key={a.text}>{a.text} <span className="text-gray-500">с {formatWhen(a.since)}</span></li>)}
              </ul>
            </div>
          )}
        </div>
      )}
      {notice && <p role="status" className="text-sm mt-3" style={{ color: '#86efac' }}>{notice}</p>}
      {error && <div className="mt-3"><ErrorText>{error}</ErrorText></div>}
    </Panel>
  )
}
