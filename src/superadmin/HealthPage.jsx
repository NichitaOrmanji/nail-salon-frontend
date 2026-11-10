import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Spinner from '../components/layout/Spinner'
import { Button, ErrorText } from '../admin/components/ui'
import { fetchHealth } from './api'
import { formatWhen } from './common'
import { Panel } from './ui'

// Состояние отметки: цвет точки + словами (не только цветом)
const STATE = {
  ok: { label: 'В порядке', color: '#22c55e', icon: '✓' },
  stale: { label: 'Давно не было', color: '#f59e0b', icon: '!' },
  failed: { label: 'Ошибка', color: '#ef4444', icon: '✕' },
  missing: { label: 'Нет данных', color: '#9ca3af', icon: '?' },
}

const CHECKS = [
  { key: 'worker', title: 'Воркер сообщений', hint: 'Отправляет Telegram, напоминания и письма; отмечается раз в минуту' },
  { key: 'backup', title: 'Ночной бэкап базы', hint: 'GitHub Actions → Backup; ждём не реже раза в 30 часов' },
  { key: 'restore_check', title: 'Проверка восстановления', hint: 'Еженедельно поднимает бэкап в пустой базе' },
]

const CONFIG = [
  ['telegram', 'Telegram-бот'],
  ['email', 'Почта (Brevo)'],
  ['sentry', 'Sentry (ошибки)'],
  ['photos', 'Фото (Cloudinary)'],
  ['signup', 'Регистрация салонов'],
]

function StateBadge({ state }) {
  const info = STATE[state] || STATE.missing
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap" style={{ color: '#d1d5db' }}>
      <span className="w-4 h-4 rounded-full inline-flex items-center justify-center text-[10px] font-bold"
        style={{ backgroundColor: info.color, color: '#111111' }} aria-hidden="true">{info.icon}</span>
      {info.label}
    </span>
  )
}

function YesNo({ value }) {
  return <StateBadge state={value ? 'ok' : 'missing'} />
}

// «5 мин назад» относительно времени ответа сервера
function since(iso, now) {
  const min = Math.max(0, Math.round((new Date(now) - new Date(iso)) / 60000))
  if (min < 1) return 'только что'
  if (min < 60) return `${min} мин назад`
  const hours = Math.round(min / 60)
  if (hours < 48) return `${hours} ч назад`
  return `${Math.round(hours / 24)} дн. назад`
}

function formatSize(bytes) {
  if (bytes == null) return '—'
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}

export default function HealthPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const request = useCallback(() => fetchHealth()
    .then(d => { setData(d); setError(null) })
    .catch(err => setError(err.message))
    .finally(() => setBusy(false)), [])

  useEffect(() => { request() }, [request])

  function load() {
    setBusy(true)
    request()
  }

  if (!data) return error ? <ErrorText>{error}</ErrorText> : <Spinner />
  const { problems, checks, queue, config, server } = data

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold text-white">Техническое состояние</h1>
        <span className="text-gray-500 text-sm">на {formatWhen(data.now)}</span>
        <div className="ml-auto"><Button disabled={busy} onClick={load}>Обновить</Button></div>
      </div>
      {error && <ErrorText>{error}</ErrorText>}

      <section role="status" className="rounded-2xl p-5"
        style={problems.length
          ? { backgroundColor: '#2a1414', border: '1px solid #7f1d1d' }
          : { backgroundColor: '#132117', border: '1px solid #166534' }}>
        <p className="text-xs text-gray-400 mb-2">
          Тревоги о проблемах приходят в Telegram — подключается в разделе <Link to="/superadmin/security" className="underline">«Безопасность и Telegram»</Link>.
        </p>
        {problems.length === 0 ? (
          <p className="text-white font-medium">✓ Всё работает: проблем не найдено</p>
        ) : (
          <>
            <p className="text-white font-medium mb-2">Требует внимания ({problems.length})</p>
            <ul className="list-disc pl-5 space-y-1 text-sm" style={{ color: '#fecaca' }}>
              {problems.map(p => <li key={p}>{p}</li>)}
            </ul>
          </>
        )}
      </section>

      <Panel title="Фоновые задачи">
        <div className="grid gap-3 sm:grid-cols-3">
          {CHECKS.map(c => {
            const row = checks[c.key]
            const details = Object.entries(row.details || {})
            return (
              <div key={c.key} className="rounded-xl p-4" style={{ backgroundColor: '#141414', border: '1px solid #2e2e2e' }}>
                <div className="text-white font-medium">{c.title}</div>
                <div className="mt-2"><StateBadge state={row.state} /></div>
                <div className="text-gray-400 text-sm mt-2">{row.at ? `${since(row.at, data.now)} · ${formatWhen(row.at)}` : 'Отметок ещё не было'}</div>
                {details.length > 0 && (
                  <div className="text-gray-500 text-xs mt-1">{details.map(([k, v]) => `${k}: ${v}`).join(' · ')}</div>
                )}
                <p className="text-gray-500 text-xs mt-2">{c.hint}</p>
              </div>
            )
          })}
        </div>
      </Panel>

      <Panel title="Очередь Telegram">
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 mb-4">
          {[
            ['В очереди', queue.pending],
            ['С ошибками', queue.failing],
            ['Отправлено за сутки', queue.sent_24h],
            ['Самое старое', queue.oldest_pending_at ? since(queue.oldest_pending_at, data.now) : '—'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl p-3" style={{ backgroundColor: '#141414', border: '1px solid #2e2e2e' }}>
              <div className="text-gray-400 text-xs">{label}</div>
              <div className="text-white text-lg font-semibold mt-1">{value}</div>
            </div>
          ))}
        </div>
        {queue.errors.length === 0 ? (
          <p className="text-gray-400 text-sm">Ошибок отправки нет</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="text-left text-gray-400 text-xs pb-2">Последние ошибки (тексты сообщений не показываются)</caption>
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4 font-medium">Когда</th>
                  <th className="py-2 pr-4 font-medium">Попыток</th>
                  <th className="py-2 font-medium">Ошибка</th>
                </tr>
              </thead>
              <tbody>
                {queue.errors.map((e, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #2e2e2e' }}>
                    <td className="py-2 pr-4 text-gray-400 whitespace-nowrap">{formatWhen(e.at)}</td>
                    <td className="py-2 pr-4 text-gray-300">{e.attempts}</td>
                    <td className="py-2 text-gray-300 break-all">{e.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Настройки">
          <dl className="space-y-2 text-sm">
            {CONFIG.map(([key, label]) => (
              <div key={key} className="flex items-center gap-3">
                <dt className="text-gray-300 flex-1">{label}</dt>
                <dd><YesNo value={config[key]} /></dd>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <dt className="text-gray-300 flex-1">DEBUG</dt>
              <dd><StateBadge state={config.debug ? 'failed' : 'ok'} /></dd>
            </div>
          </dl>
        </Panel>
        <Panel title="Сервер">
          <dl className="space-y-2 text-sm">
            {[
              ['Django', server.django],
              ['База данных', server.database],
              ['Размер базы', formatSize(server.database_size)],
              ['Непримененные миграции', server.pending_migrations ?? '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center gap-3">
                <dt className="text-gray-300 flex-1">{label}</dt>
                <dd className="text-white">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </>
  )
}
