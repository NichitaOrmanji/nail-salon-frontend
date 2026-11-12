import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { fetchOnboarding, resendVerification } from '../api/signup'
import { fetchStaffCompany } from '../api/company'
import { useStaffAuth } from '../context/StaffAuthContext'
import TelegramModal from './TelegramModal'
import { Button, ButtonLink, ErrorText } from './ui'
import Spinner from '../../components/layout/Spinner'
import { t, tr } from '../../i18n'

const STEPS = tr({
  email: { title: 'Подтвердите email', text: 'Пока email не подтверждён, клиенты не видят сайт записи.', doneText: 'Email подтверждён — сайт записи виден клиентам.' },
  salon: { title: 'Адрес и телефон салона', text: 'Клиенты увидят их на сайте; можно добавить фото и точку на карте.', to: '/admin-panel/salon', action: 'О салоне' },
  services: { title: 'Услуги и цены', text: 'Что вы делаете, сколько длится и стоит.', to: '/admin-panel/services', action: 'Услуги' },
  masters: { title: 'Мастера', text: 'Добавьте мастеров и отметьте, какие услуги делает каждый.', to: '/admin-panel/masters', action: 'Мастера' },
  schedule: { title: 'График работы', text: 'Рабочие дни, часы и обед — клиенты запишутся только в рабочее время.', to: '/admin-panel/masters?tab=schedules', action: 'Графики' },
  telegram: { title: 'Уведомления в Telegram', text: 'Новые записи и отмены будут приходить вам в Telegram (необязательно).' },
})

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
  return <Button onClick={copy}>{copied ? t('Скопировано ✓') : label}</Button>
}

// Ссылка на сайт записи: скопировать, поделиться, QR, готовый текст для соцсетей
function ShareCard({ url, name, ready }) {
  const qr = useQrCode(url)
  const post = t('Записывайтесь онлайн в «{name}» — выберите мастера и удобное время: {url}', { name, url })
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  return (
    <section className="rounded-2xl p-4 mb-5" style={{ backgroundColor: '#1f1f1f', border: `1px solid ${ready ? '#db2777' : '#2e2e2e'}` }}>
      <h2 className="text-white text-base font-semibold mb-1">{t('Ваша ссылка для записи')}</h2>
      {!ready && (
        <p className="text-gray-400 text-xs mb-2">
          {t('Клиенты смогут записаться, когда вы подтвердите email и добавите мастера с услугой и графиком.')}
        </p>
      )}
      <a href={url} target="_blank" rel="noreferrer" className="block text-sm font-medium underline break-all mb-3" style={{ color: '#f472b6' }}>
        {url}
      </a>
      <div className="flex flex-wrap gap-2 mb-4">
        <CopyButton text={url} label={t('Скопировать ссылку')} />
        {canShare && <Button onClick={() => navigator.share({ title: name, text: post, url }).catch(() => {})}>{t('Поделиться')}</Button>}
        <ButtonLink href={url} target="_blank" rel="noreferrer">{t('Открыть сайт ↗')}</ButtonLink>
      </div>

      <div className="grid sm:grid-cols-[160px_1fr] gap-4 items-start">
        <div className="text-center">
          {qr ? <img src={qr} alt={t('QR-код со ссылкой на запись в {name}', { name })} className="w-40 h-40 rounded-xl mx-auto" /> : <div className="w-40 h-40 mx-auto" />}
          {qr && <a href={qr} download={`qr-${name}.png`} className="text-xs underline text-gray-400">{t('Скачать QR-код')}</a>}
        </div>
        <div className="space-y-2 text-sm text-gray-300">
          <div>
            <div className="text-gray-400 text-xs mb-1">{t('Текст для публикации')}</div>
            <p className="rounded-xl p-3 text-sm break-words" style={{ backgroundColor: '#242424' }}>{post}</p>
            <div className="mt-2"><CopyButton text={post} label={t('Скопировать текст')} /></div>
          </div>
          <ul className="text-gray-400 text-xs space-y-1 list-disc pl-4">
            <li>{t('Instagram: «Редактировать профиль» → «Ссылки» — добавьте ссылку в шапку профиля.')}</li>
            <li>{t('Facebook, TikTok, Telegram-канал, Google Карты — ссылка в описании или кнопке «Записаться».')}</li>
            <li>{t('QR-код — на ресепшен, визитки и зеркало: клиент записывается со своего телефона.')}</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

// Карточка салона: как его видят клиенты (фото, название, адрес, телефон, описание)
function SalonCard({ company }) {
  return (
    <section className="rounded-2xl overflow-hidden mb-5" style={{ backgroundColor: '#1f1f1f', border: '1px solid #2e2e2e' }}>
      {company.main_photo && (
        <img src={company.main_photo} alt="" className="w-full h-36 object-cover" />
      )}
      <div className="p-4 flex items-start gap-3">
        {company.logo
          ? <img src={company.logo} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
          : (
            <span className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0" style={{ backgroundColor: '#2e1f28', color: '#f472b6' }}>
              {(company.name || '?').trim().charAt(0).toUpperCase()}
            </span>
          )}
        <div className="flex-1 min-w-0">
          <h2 className="text-white text-lg font-semibold break-words">{company.name}</h2>
          <dl className="mt-1 space-y-0.5 text-sm">
            <div className="flex gap-2"><dt className="text-gray-500 w-16 flex-shrink-0">{t('Адрес')}</dt><dd className="text-gray-200 break-words">{company.address || <span className="text-gray-500">{t('не указан')}</span>}</dd></div>
            <div className="flex gap-2"><dt className="text-gray-500 w-16 flex-shrink-0">{t('Телефон')}</dt><dd className="text-gray-200">{company.phone || <span className="text-gray-500">{t('не указан')}</span>}</dd></div>
          </dl>
          {company.description && <p className="text-gray-400 text-sm mt-2 whitespace-pre-line break-words">{company.description}</p>}
        </div>
      </div>
    </section>
  )
}

// «О салоне»: карточка салона, ссылка и QR для клиентов;
// шаги настройки — пока она не закончена
export default function SalonOverview({ asPage = false }) {
  const { me, refreshMe } = useStaffAuth()
  const location = useLocation()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [telegramOpen, setTelegramOpen] = useState(false)
  const [resend, setResend] = useState(null)

  const [company, setCompany] = useState(null)
  const load = useCallback(() => {
    fetchOnboarding().then(result => { setData(result); setError(null) }).catch(err => setError(err.message))
    fetchStaffCompany().then(setCompany).catch(() => {})
  }, [])
  useEffect(() => { load() }, [load])

  async function sendAgain() {
    setResend('sending')
    try {
      const result = await resendVerification()
      setResend(t('Письмо отправлено на {email}', { email: result.email }))
    } catch (err) {
      setResend(err.message)
    }
  }

  const trialEnds = data?.trial_ends_at
    ? new Date(data.trial_ends_at).toLocaleDateString(t('ru-RU'), { day: 'numeric', month: 'long' })
    : null

  return (
    <section aria-labelledby="salon-overview-title">
      {asPage
        ? <h1 id="salon-overview-title" className="text-white text-2xl font-bold tracking-tight">{t('О салоне')}</h1>
        : <h2 id="salon-overview-title" className="text-white text-xl font-bold tracking-tight">{t('О салоне')}</h2>}
      <p className="text-gray-500 text-sm mt-1 mb-4">{trialEnds ? t('Пробный период — до {date}', { date: trialEnds }) : t('Как вас видят клиенты и ссылка для записи')}</p>
      {location.state?.welcome && (
        <div className="rounded-2xl p-4 mb-5 text-sm" style={{ backgroundColor: '#2e1f28', border: '1px solid #db2777' }}>
          <div className="text-white font-semibold mb-1">{t('Салон «{name}» создан 🎉', { name: me?.company?.name })}</div>
          <div className="text-gray-300">
            {t('Пройдите шаги ниже — это займёт 10–15 минут.')}{' '}{location.state?.emailSent !== false
              ? t('Мы отправили письмо на {email} — подтвердите email.', { email: me?.email })
              : t('Письмо с подтверждением отправить не удалось — нажмите «Отправить ещё раз».')}
          </div>
        </div>
      )}
      <ErrorText>{error}</ErrorText>
      {!data && !error && <Spinner />}
      {data && (
        <>
          {company && <SalonCard company={company} />}
          {/* Салон готов — сначала ссылка; пока нет — сначала шаги, ссылка ниже */}
          {data.ready && <ShareCard url={data.public_url} name={me?.company?.name || ''} ready />}

          {data.done === data.total ? (
            <p className="text-sm mb-2" style={{ color: '#34d399' }}>{t('✓ Салон настроен: все шаги выполнены')}</p>
          ) : (
          <>
          <h2 className="text-white text-base font-semibold mb-2">{t('Настройка салона')}</h2>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#242424' }}
              role="progressbar" aria-valuemin={0} aria-valuemax={data.total} aria-valuenow={data.done} aria-label={t('Настройка салона')}>
              <div className="h-full rounded-full" style={{ width: `${(data.done / data.total) * 100}%`, backgroundColor: '#34d399' }} />
            </div>
            <span className="text-gray-400 text-xs">{data.done}{' '}{t('из {total}', { total: data.total })}</span>
          </div>

          <ol className="space-y-2">
            {data.steps.map(step => {
              const info = STEPS[step.key] || { title: step.key, text: '' }
              return (
                <li key={step.key} className="rounded-2xl p-4 flex flex-wrap items-start gap-3"
                  style={{ backgroundColor: '#1f1f1f', border: '1px solid #2e2e2e' }}>
                  <span aria-hidden="true" className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={step.done ? { backgroundColor: '#34d399', color: '#111' } : { border: '2px solid #4b4b4b' }}>
                    {step.done ? '✓' : ''}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-semibold">
                      {info.title}<span className="sr-only">{step.done ? t(' — готово') : t(' — не сделано')}</span>
                    </div>
                    <div className="text-gray-400 text-xs mt-0.5">{(step.done && info.doneText) || info.text}</div>
                    {step.key === 'email' && !step.done && (
                      <div className="text-xs mt-2">
                        <span className="text-gray-300">{t('Письмо на {email}.', { email: me?.email })}{' '}</span>
                        <button type="button" onClick={sendAgain} disabled={resend === 'sending'} className="underline" style={{ color: '#f472b6' }}>
                          {t('Отправить ещё раз')}
                        </button>
                        {resend && resend !== 'sending' && <div className="text-gray-400 mt-1">{resend}</div>}
                        <button type="button" onClick={() => { refreshMe().catch(() => {}); load() }} className="underline ml-2 text-gray-400">
                          {t('Я подтвердил(а)')}
                        </button>
                      </div>
                    )}
                  </div>
                  {info.to && !step.done && <ButtonLink to={info.to}>{info.action}</ButtonLink>}
                  {step.key === 'telegram' && !step.done && <Button onClick={() => setTelegramOpen(true)}>{t('Подключить')}</Button>}
                </li>
              )
            })}
          </ol>
          </>
          )}
          <p className="text-gray-500 text-xs mt-4">
            {t('Подробные инструкции — в разделе')}{' '}<Link to="/admin-panel/help" className="underline">{t('Помощь')}</Link>{t('. Данные салона меняются в форме «Салон».')}
          </p>
          {!data.ready && <div className="mt-5"><ShareCard url={data.public_url} name={me?.company?.name || ''} ready={false} /></div>}
        </>
      )}
      {telegramOpen && <TelegramModal onClose={() => { setTelegramOpen(false); load() }} />}
    </section>
  )
}
