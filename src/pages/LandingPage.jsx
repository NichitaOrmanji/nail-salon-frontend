import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
// Шрифты — с нашего домена (CSP). В Plus Jakarta Sans и Instrument Serif нет кириллицы:
// русские буквы берутся из близких по характеру Manrope и Playfair Display
import '@fontsource/plus-jakarta-sans/latin-400.css'
import '@fontsource/plus-jakarta-sans/latin-500.css'
import '@fontsource/plus-jakarta-sans/latin-600.css'
import '@fontsource/plus-jakarta-sans/latin-700.css'
import '@fontsource/plus-jakarta-sans/latin-800.css'
import '@fontsource/manrope/cyrillic-400.css'
import '@fontsource/manrope/cyrillic-500.css'
import '@fontsource/manrope/cyrillic-600.css'
import '@fontsource/manrope/cyrillic-700.css'
import '@fontsource/manrope/cyrillic-800.css'
import '@fontsource/instrument-serif/latin-400-italic.css'
import '@fontsource/playfair-display/cyrillic-500-italic.css'
import './landing.css'

// Страница продукта: что это, как начать и кнопка «Начать работу» → регистрация.
// Открывается на /welcome, а на домене timepoint.tech — как главная (см. App.jsx).

const SIGNUP = '/admin-panel/signup'
const LOGIN = '/admin-panel/login'
const THEME_KEY = 'tp-landing-theme'

// Иконки Lucide (stroke-width 1.5)
const ICONS = {
  'arrow-right': <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  'layout-grid': <><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></>,
  calendar: <><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></>,
  'calendar-check': <><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /><path d="m9 16 2 2 4-4" /></>,
  'chevron-left': <path d="m15 18-6-6 6-6" />,
  'chevron-right': <path d="m9 18 6-6-6-6" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
  link: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>,
  'qr-code': <><rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  wallet: <><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></>,
  'shield-check': <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
  languages: <><path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></>,
  smartphone: <><rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  settings: <><path d="M20 7h-9" /><path d="M14 17H5" /><circle cx="17" cy="17" r="3" /><circle cx="7" cy="7" r="3" /></>,
  share: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.59 13.51 6.83 3.98" /><path d="m15.41 6.51-6.82 3.98" /></>,
  moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></>,
}

function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      {ICONS[name]}
    </svg>
  )
}

function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M32 8a24 24 0 1 0 24 24" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      <circle cx="50" cy="14" r="7" fill="var(--accent)" />
    </svg>
  )
}

function Ping({ color = 'var(--accent)', size = 'h-2 w-2' }) {
  return (
    <span className={`relative flex ${size} shrink-0`} aria-hidden="true">
      <span className="ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: color }} />
      <span className={`relative inline-flex ${size} rounded-full`} style={{ background: color }} />
    </span>
  )
}

function Badge({ children, tone = 'accent' }) {
  const tones = {
    accent: { background: 'var(--accent-soft)', color: 'var(--accent-text)' },
    bad: { background: 'var(--bad-soft)', color: 'var(--bad)' },
    wait: { background: 'var(--wait-soft)', color: 'var(--wait)' },
    info: { background: 'var(--info-soft)', color: 'var(--info)' },
  }
  return (
    <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wider" style={tones[tone]}>
      {children}
    </span>
  )
}

// Тема лендинга: выбор посетителя (запоминается) или тема устройства
function useLandingTheme() {
  const [stored, setStored] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) } catch { return null }
  })
  const [system, setSystem] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!media) return undefined
    const onChange = e => setSystem(e.matches ? 'dark' : 'light')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  const theme = stored === 'light' || stored === 'dark' ? stored : system
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setStored(next)
    try { localStorage.setItem(THEME_KEY, next) } catch { /* без хранилища — до перезагрузки */ }
  }
  return [theme, toggle]
}

const JOURNAL = [
  { name: 'Ольга', blocks: [
    { top: 6, h: 64, tone: 'ok', title: 'Стрижка', time: '10:00–11:00' },
    { top: 96, h: 56, tone: 'info', title: 'Окрашивание', time: '12:30' },
    { top: 196, h: 56, tone: 'wait', title: 'Укладка', time: '15:00 · ждёт' },
  ] },
  { name: 'Анна', blocks: [
    { top: 30, h: 56, tone: 'done', title: 'Массаж', time: '10:30 · пришёл' },
    { top: 128, h: 84, tone: 'ok', title: 'Консультация', time: '13:00–14:30' },
  ] },
  { name: 'Мария', blocks: [
    { top: 6, h: 52, tone: 'bad', title: 'Не пришла', time: '10:00' },
    { top: 80, h: 64, tone: 'wait', title: 'Маникюр', time: '11:30 · ждёт' },
    { top: 176, h: 72, tone: 'ok', title: 'Педикюр', time: '14:30–16:00' },
  ] },
]

const LEGEND = [['ok', 'Подтверждена'], ['wait', 'Ждёт подтверждения'], ['info', 'Записал администратор'], ['done', 'Пришёл'], ['bad', 'Не пришёл']]

const STEPS = [
  { tone: 'accent', icon: 'clock', tag: '2 минуты', title: 'Создайте аккаунт', text: 'Название, email и пароль. Адрес страницы записи подберётся по названию.' },
  { tone: 'wait', icon: 'settings', tag: 'Один вечер', title: 'Добавьте услуги и график', text: 'Цены, специалисты, рабочие часы. Раздел «Начало работы» покажет, что осталось.' },
  { tone: 'info', icon: 'share', tag: 'Сразу', title: 'Поделитесь ссылкой', text: 'В профиле соцсетей и на картах. Записи начнут приходить сами.' },
]

const FAQ = [
  { q: 'Сколько это стоит?', a: 'Первые 14 дней бесплатно, банковская карта не нужна. О стоимости после пробного периода сообщим заранее.' },
  { q: 'Нужен ли свой сайт?', a: 'Нет. Вы получаете готовую страницу записи со своим названием, фото, адресом и картой.' },
  { q: 'Что нужно клиентам?', a: 'Только телефон и ссылка. Скачивать приложение не нужно.' },
  { q: 'Можно дать доступ сотрудникам?', a: 'Да. Администратор ведёт журнал, специалист видит свои записи и зарплату. Касса и отчёты доступны только владельцу.' },
]

function CardTitle({ icon, children, badge }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="icon-pad"><Icon name={icon} /></span>
        <h3 className="text-lg font-bold tracking-tight">{children}</h3>
      </div>
      {badge}
    </div>
  )
}

function BookingExample() {
  const slots = [['10:00'], ['11:00', 'busy'], ['12:30'], ['14:30', 'picked'], ['16:00', 'busy'], ['17:30']]
  return (
    <div className="flex min-w-0 flex-col gap-3 lg:col-span-5" aria-label="Пример страницы записи">
      <div className="card rounded-[28px] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="tp-invert grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-extrabold">ВС</div>
            <div className="min-w-0">
              <p className="truncate font-bold tracking-tight">Ваша студия</p>
              <p className="truncate text-[13px] muted">Консультация · 45 мин · 300 лей</p>
            </div>
          </div>
          <Badge>Онлайн</Badge>
        </div>
        <div className="mt-5 flex items-center justify-between border-t hairline pt-4 text-sm">
          <span className="font-semibold">Пятница, 14 ноября</span>
          <span className="flex items-center gap-1 muted"><Icon name="chevron-left" /><Icon name="chevron-right" /></span>
        </div>
        <div className="num mt-3 grid grid-cols-3 gap-2 text-sm font-semibold">
          {slots.map(([time, state]) => (
            <span key={time}
              className={`rounded-lg py-2.5 text-center ${state === 'picked' ? 'btn-primary' : 'soft'} ${state === 'busy' ? 'line-through sub' : ''}`}>
              {time}
            </span>
          ))}
        </div>
        <div className="tp-invert mt-4 flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold">
          <Icon name="calendar-check" /> Записаться на 14:30
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.4fr_1fr]">
        <div className="card flex min-w-0 items-start gap-3 rounded-2xl p-4">
          <span className="icon-pad"><Icon name="send" /></span>
          <div className="min-w-0">
            <p className="text-[12px] muted">Telegram · сейчас</p>
            <p className="text-sm font-bold">Новая запись: Анна</p>
            <p className="text-[13px] muted">пт, 14:30</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 rounded-2xl p-4">
          <Ping color="var(--ok)" size="h-2.5 w-2.5" />
          <div className="min-w-0">
            <p className="text-[12px] muted">Статус</p>
            <p className="text-sm font-bold" style={{ color: 'var(--ok)' }}>Подтверждена</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Journal() {
  return (
    <article className="card hover-lift min-w-0 rounded-[28px] p-6 md:col-span-6 lg:col-span-8 lg:row-span-2">
      <CardTitle icon="calendar" badge={<Badge>Главный экран</Badge>}>Журнал записей</CardTitle>
      <p className="mt-3 max-w-lg text-sm leading-relaxed muted">День или неделя по специалистам. Цвет записи сразу показывает её состояние.</p>
      <div className="mt-6 overflow-x-auto rounded-xl" tabIndex={0} role="region" aria-label="Пример журнала записей на день">
        <div className="grid min-w-[520px] grid-cols-[48px_repeat(3,minmax(0,1fr))] gap-x-2 text-[12px]" aria-hidden="true">
          <span />
          {JOURNAL.map(m => <span key={m.name} className="pb-2 font-bold">{m.name}</span>)}
          <div className="num relative muted" style={{ height: 300 }}>
            {['10:00', '12:00', '14:00', '16:00'].map((t, i) => (
              <span key={t} className="absolute right-1" style={{ top: `${i * 25}%` }}>{t}</span>
            ))}
          </div>
          {JOURNAL.map(m => (
            <div key={m.name} className="soft relative rounded-xl" style={{ height: 300 }}>
              {m.blocks.map(b => (
                <div key={b.title} className="absolute inset-x-1.5 rounded-lg border-l-[3px] px-2 py-1.5"
                  style={{ top: b.top, height: b.h, background: `var(--${b.tone}-soft)`, borderColor: `var(--${b.tone})` }}>
                  <b className="block truncate">{b.title}</b>
                  <span className="num sub">{b.time}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-[12px] muted">
        {LEGEND.map(([tone, label]) => (
          <li key={tone} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: `var(--${tone})` }} />{label}
          </li>
        ))}
      </ul>
    </article>
  )
}

export default function LandingPage() {
  const [theme, toggleTheme] = useLandingTheme()

  useEffect(() => {
    const previous = document.title
    document.title = 'TimePoint — онлайн-запись клиентов'
    return () => { document.title = previous }
  }, [])

  const card = 'card hover-lift min-w-0 rounded-[28px] p-6'

  return (
    <div className="tp min-h-dvh" data-theme={theme}>
      <header className="glass sticky top-0 z-20 border-b hairline">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <a href="#top" className="flex items-center gap-2.5" aria-label="TimePoint — наверх">
            <Logo />
            <span className="text-[17px] font-extrabold tracking-tight">TimePoint</span>
          </a>
          <nav className="flex items-center gap-1 text-sm font-medium" aria-label="Основное">
            <a href="#features" className="nav-link hidden rounded-lg px-3 py-2 md:inline-block">Возможности</a>
            <a href="#start" className="nav-link hidden rounded-lg px-3 py-2 md:inline-block">Как начать</a>
            <a href="#faq" className="nav-link hidden rounded-lg px-3 py-2 md:inline-block">Вопросы</a>
            <button type="button" onClick={toggleTheme} className="icon-pad hover-lift ml-1"
              aria-label={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <Link to={LOGIN} className="hover-lift inline-flex min-h-[44px] items-center rounded-lg px-3">Войти</Link>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="relative overflow-hidden border-b hairline">
          <div className="dots pointer-events-none absolute inset-0 opacity-20" aria-hidden="true"
            style={{ WebkitMaskImage: 'linear-gradient(to bottom, #000, transparent 85%)', maskImage: 'linear-gradient(to bottom, #000, transparent 85%)' }} />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 lg:grid-cols-12">
            <div className="min-w-0 lg:col-span-7">
              <span className="card inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold" style={{ boxShadow: 'none' }}>
                <Ping /> 14 дней бесплатно · без банковской карты
              </span>
              <h1 className="mt-6 text-[2.6rem] font-extrabold leading-[1.02] tracking-tighter sm:text-6xl lg:text-[4.25rem]">
                Онлайн-запись клиентов.{' '}
                <span className="serif mt-1 block text-[1.08em] tracking-tight accent-display">Всё для вашего удобства!</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed muted">
                Клиент сам выбирает услугу, специалиста и свободное время по вашей ссылке. Вы видите все записи
                в одном журнале и получаете уведомления в Telegram.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to={SIGNUP} className="btn-primary hover-lift inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-bold shadow-xl shadow-black/5">
                  Начать работу <Icon name="arrow-right" />
                </Link>
                <a href="#features" className="card hover-lift inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-semibold">
                  <Icon name="layout-grid" /> Что внутри
                </a>
              </div>
              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t hairline pt-6">
                {[['Регистрация', '2 мин'], ['Приём записей', '24/7'], ['Языки сайта', 'RU · RO']].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[13px] muted">{label}</dt>
                    <dd className="num mt-1 text-2xl font-extrabold tracking-tight">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <BookingExample />
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24">
          <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
            <h2 className="text-4xl font-extrabold tracking-tighter sm:text-5xl lg:col-span-7">
              Запись, журнал и клиенты <span className="serif tracking-tight accent-display">в одном окне</span>
            </h2>
            <p className="max-w-md text-base leading-relaxed muted lg:col-span-5 lg:justify-self-end">
              Для салонов, студий, кабинетов и частных специалистов, которые работают по записи.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-6 lg:grid-cols-12">
            <Journal />

            <article className={`${card} md:col-span-3 lg:col-span-4`}>
              <CardTitle icon="send">Telegram</CardTitle>
              <p className="mt-3 text-sm leading-relaxed muted">Вам — новые записи и отмены. Клиенту — подтверждение и напоминание накануне.</p>
              <div className="mt-4 flex flex-col gap-2 text-[13px]">
                <p className="soft w-fit max-w-full rounded-xl rounded-tl-sm px-3 py-2">Вы записаны на пт, 14:30</p>
                <p className="soft w-fit max-w-full rounded-xl rounded-tl-sm px-3 py-2">Напоминаем: завтра в 14:30</p>
              </div>
            </article>

            <article className={`${card} md:col-span-3 lg:col-span-4`}>
              <CardTitle icon="link">Ссылка и QR-код</CardTitle>
              <p className="mt-3 text-sm leading-relaxed muted">Для соцсетей, Google Maps и ресепшена. Клиенту ничего не нужно устанавливать.</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="tp-invert grid h-12 w-12 shrink-0 place-items-center rounded-lg"><Icon name="qr-code" /></span>
                <span className="min-w-0 break-all rounded-lg px-2.5 py-1.5 text-[13px] font-semibold" style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}>
                  studio.timepoint.tech
                </span>
              </div>
            </article>

            <article className={`${card} md:col-span-6 lg:col-span-5`}>
              <CardTitle icon="users" badge={<Badge tone="bad">Чёрный список</Badge>}>База клиентов</CardTitle>
              <p className="mt-3 text-sm leading-relaxed muted">История визитов, долги и защита от тех, кто записывается и не приходит.</p>
              <ul className="mt-4 flex flex-col gap-2 text-sm">
                <li className="soft flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"><span className="min-w-0 truncate font-semibold">Анна К.</span><span className="num shrink-0 text-[12px] sub">12 визитов</span></li>
                <li className="soft flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"><span className="min-w-0 truncate font-semibold">Ирина М.</span><Badge tone="wait">долг 150 лей</Badge></li>
                <li className="soft flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"><span className="min-w-0 truncate font-semibold">Виктор С.</span><Badge tone="bad">2 неявки</Badge></li>
              </ul>
            </article>

            <article className={`${card} md:col-span-3 lg:col-span-4`}>
              <CardTitle icon="wallet">Касса и зарплаты</CardTitle>
              <p className="num mt-4 text-3xl font-extrabold tracking-tighter">18 450 <span className="text-sm font-semibold tracking-normal muted">лей за неделю</span></p>
              <div className="mt-4 flex items-end gap-1.5" style={{ height: 72 }} aria-hidden="true">
                {[42, 58, 36, 70, 88, 100, 64].map((h, i) => (
                  <span key={i} className={`flex-1 rounded ${i === 5 ? '' : 'soft'}`} style={{ height: `${h}%`, background: i === 5 ? 'var(--accent)' : undefined }} />
                ))}
              </div>
              <div className="num mt-1.5 grid grid-cols-7 text-center text-[11px] muted" aria-hidden="true">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => <span key={d}>{d}</span>)}
              </div>
            </article>

            <article className={`${card} md:col-span-3 lg:col-span-3`}>
              <CardTitle icon="shield-check">Доступы</CardTitle>
              <ul className="mt-4 flex flex-col gap-3 text-sm">
                <li><b className="block">Владелец</b><span className="muted">всё, включая кассу</span></li>
                <li><b className="block">Администратор</b><span className="muted">журнал и клиенты</span></li>
                <li><b className="block">Специалист</b><span className="muted">свои записи и зарплата</span></li>
              </ul>
            </article>

            <article className="tp-invert hover-lift relative min-w-0 overflow-hidden rounded-[28px] p-6 shadow-xl shadow-black/5 md:col-span-3 lg:col-span-4">
              <div className="grid-lines pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden="true" style={{ '--pattern': 'var(--invert-fg)' }} />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-[10px]" style={{ background: 'color-mix(in srgb, var(--invert-fg) 10%, transparent)' }}><Icon name="bell" /></span>
                  <h3 className="text-lg font-bold tracking-tight">Меньше неявок</h3>
                </div>
                <p className="mt-5 text-5xl font-extrabold tracking-tighter">за 24 <span className="serif">часа</span></p>
                <p className="mt-2 text-sm opacity-80">клиент получает напоминание, а вы — правила отмены и штраф за неявку</p>
              </div>
            </article>

            <article className={`${card} md:col-span-3 lg:col-span-4`}>
              <CardTitle icon="languages">Русский и румынский</CardTitle>
              <p className="mt-3 text-sm leading-relaxed muted">Клиент выбирает язык сайта записи сам.</p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold">
                <span className="rounded-lg px-3 py-1.5" style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}>Записаться</span>
                <span className="soft rounded-lg px-3 py-1.5">Programează-te</span>
              </div>
            </article>

            <article className={`${card} md:col-span-6 lg:col-span-4`}>
              <CardTitle icon="smartphone">Работает в браузере</CardTitle>
              <p className="mt-3 text-sm leading-relaxed muted">Панель открывается с телефона и компьютера. Ничего не нужно скачивать ни вам, ни клиентам.</p>
            </article>
          </div>
        </section>

        <section id="start" className="relative scroll-mt-20 border-y hairline">
          <div className="dots pointer-events-none absolute inset-0 opacity-20" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-4 py-24">
            <h2 className="text-4xl font-extrabold tracking-tighter sm:text-5xl">
              Запуск за <span className="serif tracking-tight accent-display">один вечер</span>
            </h2>
            <ol className="mt-12 grid gap-4 md:grid-cols-3">
              {STEPS.map(step => (
                <li key={step.title} className="card hover-lift flex flex-col gap-3 rounded-[28px] p-6">
                  <Badge tone={step.tone}><Icon name={step.icon} size={14} /> {step.tag}</Badge>
                  <h3 className="text-lg font-bold tracking-tight">{step.title}</h3>
                  <p className="text-sm leading-relaxed muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="faq" className="mx-auto grid max-w-6xl scroll-mt-20 gap-10 px-4 py-24 lg:grid-cols-12">
          <h2 className="text-4xl font-extrabold tracking-tighter sm:text-5xl lg:col-span-4">
            Частые <span className="serif tracking-tight accent-display">вопросы</span>
          </h2>
          <div className="flex flex-col gap-3 lg:col-span-8">
            {FAQ.map((item, i) => (
              <details key={item.q} className="card rounded-2xl" open={i === 0}>
                <summary className="flex min-h-[56px] items-center justify-between gap-4 px-5 py-4 font-bold">
                  {item.q}
                  <span className="chev muted"><Icon name="chevron-down" /></span>
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="tp-invert relative overflow-hidden rounded-[32px] shadow-xl shadow-black/5">
            <div className="grid-lines pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden="true" style={{ '--pattern': 'var(--invert-fg)' }} />
            <div className="relative grid gap-8 p-8 sm:p-12 md:grid-cols-[1fr_auto] md:items-center">
              <div className="min-w-0">
                <h2 className="text-4xl font-extrabold tracking-tighter sm:text-5xl">
                  Откройте запись <span className="serif tracking-tight" style={{ color: 'var(--accent-on-invert)' }}>сегодня</span>
                </h2>
                <p className="mt-3 max-w-md opacity-80">Аккаунт создаётся за две минуты. Первые 14 дней бесплатно.</p>
              </div>
              <Link to={SIGNUP} className="btn-primary hover-lift inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-bold md:w-auto">
                Начать работу <Icon name="arrow-right" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t hairline">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm muted">
          <span className="flex items-center gap-2 font-extrabold tracking-tight" style={{ color: 'var(--ink)' }}>
            <Logo size={22} /> TimePoint
          </span>
          <nav className="flex gap-5" aria-label="Документы">
            <Link to="/admin-panel/terms" className="nav-link inline-flex min-h-[44px] items-center">Правила сервиса</Link>
            <Link to={LOGIN} className="nav-link inline-flex min-h-[44px] items-center">Вход для бизнеса</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
