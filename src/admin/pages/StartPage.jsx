import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { fetchOnboarding, resendVerification } from '../api/signup'
import { useStaffAuth } from '../context/StaffAuthContext'
import TelegramModal from '../components/TelegramModal'
import { Button, ButtonLink, ErrorText, PageHeader } from '../components/ui'
import Spinner from '../../components/layout/Spinner'

const STEPS = {
  email: { title: 'Подтвердите email', text: 'Пока email не подтверждён, клиенты не видят сайт записи.' },
  salon: { title: 'Адрес и телефон салона', text: 'Клиенты увидят их на сайте; можно добавить фото и точку на карте.', to: '/admin-panel/settings', action: 'Настройки' },
  services: { title: 'Услуги и цены', text: 'Что вы делаете, сколько длится и стоит.', to: '/admin-panel/services', action: 'Услуги' },
  masters: { title: 'Мастера', text: 'Добавьте мастеров и отметьте, какие услуги делает каждый.', to: '/admin-panel/masters', action: 'Мастера' },
  schedule: { title: 'График работы', text: 'Рабочие дни, часы и обед — клиенты запишутся только в рабочее время.', to: '/admin-panel/masters?tab=schedules', action: 'Графики' },
  telegram: { title: 'Уведомления в Telegram', text: 'Новые записи и отмены будут приходить вам в Telegram (необязательно).' },
}

function useQrCode(url) {
  const [image, setImage] = useState(null)
  useEffect(() => {
    let alive = true
    // Библиотека QR — отдельным файлом, только на этой странице
    import('qrcode')
      .then(QR => QR.toDataURL(url, { width: 480, margin: 2, color: { dark: '#111111', light: '#ffffff' } }))
      .then(data => { if (alive) setImage(data) })
      .catch(() => {})
    return () => { alive = false }
  }, [url])
  return image
}

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* нет доступа к буферу — текст можно выделить вручную */ }
  }
  return <Button onClick={copy}>{copied ? 'Скопировано ✓' : label}</Button>
}

// Ссылка на сайт записи: скопировать, поделиться, QR, готовый текст для соцсетей
function ShareCard({ url, name, ready }) {
  const qr = useQrCode(url)
  const post = `Записывайтесь онлайн в «${name}» — выберите мастера и удобное время: ${url}`
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  return (
    <section className="rounded-2xl p-4 mb-5" style={{ backgroundColor: 'var(--surface-1)', border: `1px solid ${ready ? 'var(--accent)' : 'var(--border)'}` }}>
      <h2 className="text-white text-base font-semibold mb-1">Ваша ссылка для записи</h2>
      {!ready && (
        <p className="text-gray-400 text-xs mb-2">
          Клиенты смогут записаться, когда вы подтвердите email и добавите мастера с услугой и графиком.
        </p>
      )}
      <a href={url} target="_blank" rel="noreferrer" className="block text-sm font-medium underline break-all mb-3" style={{ color: 'var(--accent-text)' }}>
        {url}
      </a>
      <div className="flex flex-wrap gap-2 mb-4">
        <CopyButton text={url} label="Скопировать ссылку" />
        {canShare && <Button onClick={() => navigator.share({ title: name, text: post, url }).catch(() => {})}>Поделиться</Button>}
        <ButtonLink href={url} target="_blank" rel="noreferrer">Открыть сайт ↗</ButtonLink>
      </div>

      <div className="grid sm:grid-cols-[160px_1fr] gap-4 items-start">
        <div className="text-center">
          {qr ? <img src={qr} alt={`QR-код со ссылкой на запись в ${name}`} className="w-40 h-40 rounded-xl mx-auto" /> : <div className="w-40 h-40 mx-auto" />}
          {qr && <a href={qr} download={`qr-${name}.png`} className="text-xs underline text-gray-400">Скачать QR-код</a>}
        </div>
        <div className="space-y-2 text-sm text-gray-300">
          <div>
            <div className="text-gray-400 text-xs mb-1">Текст для публикации</div>
            <p className="rounded-xl p-3 text-sm break-words" style={{ backgroundColor: 'var(--surface-2)' }}>{post}</p>
            <div className="mt-2"><CopyButton text={post} label="Скопировать текст" /></div>
          </div>
          <ul className="text-gray-400 text-xs space-y-1 list-disc pl-4">
            <li>Instagram: «Редактировать профиль» → «Ссылки» — добавьте ссылку в шапку профиля.</li>
            <li>Facebook, TikTok, Telegram-канал, Google Карты — ссылка в описании или кнопке «Записаться».</li>
            <li>QR-код — на ресепшен, визитки и зеркало: клиент записывается со своего телефона.</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

// «Начало работы»: шаги настройки салона и ссылка на сайт записи
export default function StartPage() {
  const { me, refreshMe } = useStaffAuth()
  const location = useLocation()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [telegramOpen, setTelegramOpen] = useState(false)
  const [resend, setResend] = useState(null)

  const load = useCallback(() => {
    fetchOnboarding().then(result => { setData(result); setError(null) }).catch(err => setError(err.message))
  }, [])
  useEffect(() => { load() }, [load])

  async function sendAgain() {
    setResend('sending')
    try {
      const result = await resendVerification()
      setResend(`Письмо отправлено на ${result.email}`)
    } catch (err) {
      setResend(err.message)
    }
  }

  const trialEnds = data?.trial_ends_at
    ? new Date(data.trial_ends_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
    : null

  return (
    <div className="px-4 md:px-6 py-5 max-w-3xl">
      <PageHeader title="Начало работы" subtitle={trialEnds ? `Пробный период — до ${trialEnds}` : 'Настройка салона и ссылка для клиентов'} />
      {location.state?.welcome && (
        <div className="rounded-2xl p-4 mb-5 text-sm" style={{ backgroundColor: 'var(--accent-tint)', border: '1px solid var(--accent)' }}>
          <div className="text-white font-semibold mb-1">Салон «{me?.company?.name}» создан 🎉</div>
          <div className="text-gray-300">
            Пройдите шаги ниже — это займёт 10–15 минут. {location.state?.emailSent !== false
              ? `Мы отправили письмо на ${me?.email} — подтвердите email.`
              : 'Письмо с подтверждением отправить не удалось — нажмите «Отправить ещё раз».'}
          </div>
        </div>
      )}
      <ErrorText>{error}</ErrorText>
      {!data && !error && <Spinner />}
      {data && (
        <>
          {/* Салон готов — сначала ссылка; пока нет — сначала шаги, ссылка ниже */}
          {data.ready && <ShareCard url={data.public_url} name={me?.company?.name || ''} ready />}

          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}
              role="progressbar" aria-valuemin={0} aria-valuemax={data.total} aria-valuenow={data.done} aria-label="Настройка салона">
              <div className="h-full rounded-full" style={{ width: `${(data.done / data.total) * 100}%`, backgroundColor: 'var(--success-strong)' }} />
            </div>
            <span className="text-gray-400 text-xs">{data.done} из {data.total}</span>
          </div>

          <ol className="space-y-2">
            {data.steps.map(step => {
              const info = STEPS[step.key] || { title: step.key, text: '' }
              return (
                <li key={step.key} className="rounded-2xl p-4 flex flex-wrap items-start gap-3"
                  style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)' }}>
                  <span aria-hidden="true" className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={step.done ? { backgroundColor: 'var(--success-strong)', color: '#111' } : { border: '2px solid var(--border-strong)' }}>
                    {step.done ? '✓' : ''}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-semibold">
                      {info.title}<span className="sr-only">{step.done ? ' — готово' : ' — не сделано'}</span>
                    </div>
                    <div className="text-gray-400 text-xs mt-0.5">{info.text}</div>
                    {step.key === 'email' && !step.done && (
                      <div className="text-xs mt-2">
                        <span className="text-gray-300">Письмо на {me?.email}. </span>
                        <button type="button" onClick={sendAgain} disabled={resend === 'sending'} className="underline" style={{ color: 'var(--accent-text)' }}>
                          Отправить ещё раз
                        </button>
                        {resend && resend !== 'sending' && <div className="text-gray-400 mt-1">{resend}</div>}
                        <button type="button" onClick={() => { refreshMe().catch(() => {}); load() }} className="underline ml-2 text-gray-400">
                          Я подтвердил(а)
                        </button>
                      </div>
                    )}
                  </div>
                  {info.to && !step.done && <ButtonLink to={info.to}>{info.action}</ButtonLink>}
                  {step.key === 'telegram' && !step.done && <Button onClick={() => setTelegramOpen(true)}>Подключить</Button>}
                </li>
              )
            })}
          </ol>
          <p className="text-gray-500 text-xs mt-4">
            Подробные инструкции — в разделе <Link to="/admin-panel/help" className="underline">Помощь</Link>.
          </p>
          {!data.ready && <div className="mt-5"><ShareCard url={data.public_url} name={me?.company?.name || ''} ready={false} /></div>}
        </>
      )}
      {telegramOpen && <TelegramModal onClose={() => { setTelegramOpen(false); load() }} />}
    </div>
  )
}
