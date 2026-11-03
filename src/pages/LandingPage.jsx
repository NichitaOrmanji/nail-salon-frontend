import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './landing.css'

// Страница продукта: что это, как начать и кнопка «Начать работу» → регистрация салона.
// Открывается на /welcome, а на домене timepoint.tech — как главная (см. App.jsx).
// Картинки — живые мини-экраны из HTML/CSS с теми же цветами статусов, что в журнале панели.

const SIGNUP = '/admin-panel/signup'
const LOGIN = '/admin-panel/login'

const SERVICES = ['Маникюр', 'Педикюр', 'Наращивание', 'Брови', 'Ресницы', 'Макияж', 'Массаж', 'Стрижки', 'Окрашивание', 'Депиляция']

const STEPS = [
  { tag: '2 минуты', color: '#f472b6', title: 'Создайте салон', text: 'Название, email и пароль. Адрес страницы записи подберётся по названию.' },
  { tag: 'Один вечер', color: '#c084fc', title: 'Настройте под себя', text: 'Услуги и цены, мастера, графики. «Начало работы» подскажет, что осталось.' },
  { tag: 'Сразу', color: '#fbbf24', title: 'Поделитесь ссылкой', text: 'В Instagram, на картах, QR-кодом на ресепшене. Клиенты записываются сами.' },
]

const FAQ = [
  { q: 'Сколько это стоит?', a: 'Первые 14 дней бесплатно, банковская карта не нужна. О стоимости после пробного периода сообщим заранее.' },
  { q: 'Нужен ли свой сайт?', a: 'Нет. Вы получаете готовую страницу записи со своим названием, фото, адресом и картой.' },
  { q: 'Что нужно клиентам?', a: 'Только телефон и ссылка. Скачивать приложение не нужно.' },
  { q: 'Можно дать доступ сотрудникам?', a: 'Да: администратор ведёт журнал, мастер видит свои записи и свою зарплату. Касса и отчёты — только у владельца.' },
]

// Появление блоков при прокрутке (без движения — если пользователь его отключил)
function useReveal(rootRef) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || !('IntersectionObserver' in window)) return undefined
    root.classList.add('lp-anim')
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })
    root.querySelectorAll('.lp-reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [rootRef])
}

function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5 text-white font-bold text-lg">
      <span className="w-9 h-9 rounded-xl flex items-center justify-center text-sm" aria-hidden="true"
        style={{ background: 'linear-gradient(135deg, #db2777, #9333ea)' }}>TP</span>
      TimePoint
    </span>
  )
}

function CtaLink({ className = '', children = 'Начать работу' }) {
  return (
    <Link to={SIGNUP} className={`lp-btn-primary inline-flex items-center justify-center gap-2 min-h-[52px] px-8 rounded-2xl text-base font-semibold ${className}`}>
      {children}
      <span aria-hidden="true">→</span>
    </Link>
  )
}

// Телефон клиента: выбор времени + уведомление салону
function HeroPhone() {
  const slots = ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30']
  const busy = ['11:30', '16:00']
  return (
    <div className="relative mx-auto w-[270px] sm:w-[300px]" aria-hidden="true">
      <div className="lp-float rounded-[36px] p-2.5" style={{ background: 'linear-gradient(160deg, #3a3a42, #17171b)', boxShadow: '0 40px 80px -30px rgba(147, 51, 234, 0.55)' }}>
        <div className="rounded-[28px] overflow-hidden" style={{ backgroundColor: '#1a1a1d' }}>
          <div className="h-28 relative" style={{ background: 'linear-gradient(135deg, #be185d, #7e22ce 60%, #b45309)' }}>
            <div className="absolute left-4 bottom-[-22px] w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
              style={{ background: '#0e0e11', border: '3px solid #1a1a1d' }}>N</div>
          </div>
          <div className="px-4 pt-8 pb-5">
            <p className="text-white font-semibold">Nail Studio</p>
            <p className="text-xs" style={{ color: '#a1a1aa' }}>Маникюр + покрытие · 1 ч 30 мин</p>
            <p className="text-xs mt-4 mb-2 font-medium" style={{ color: '#d4d4d8' }}>Пятница, 14 ноября</p>
            <div className="grid grid-cols-3 gap-2">
              {slots.map((time, i) => {
                const selected = time === '14:30'
                const taken = busy.includes(time)
                return (
                  <span key={time}
                    className={`lp-slot text-center text-sm rounded-xl py-2 ${selected ? 'lp-slot-selected font-semibold' : ''}`}
                    style={{
                      '--lp-delay': `${300 + i * 90}ms`,
                      backgroundColor: selected ? '#db2777' : '#242429',
                      color: selected ? '#ffffff' : taken ? '#a1a1aa' : '#e4e4e7',
                      textDecoration: taken ? 'line-through' : 'none',
                    }}>
                    {time}
                  </span>
                )
              })}
            </div>
            <div className="mt-5 rounded-xl py-3 text-center text-sm font-semibold text-white" style={{ background: 'linear-gradient(100deg, #db2777, #a21caf)' }}>
              Записаться на 14:30
            </div>
          </div>
        </div>
      </div>

      <div className="lp-notify absolute -right-3 sm:-right-24 -top-10 sm:top-10 w-[220px] rounded-2xl p-3 text-left"
        style={{ backgroundColor: 'rgba(24, 24, 27, 0.92)', border: '1px solid #3f3f46', backdropFilter: 'blur(8px)', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.8)' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{ backgroundColor: '#1479a8' }}>T</span>
          <span className="text-[11px]" style={{ color: '#a1a1aa' }}>Telegram · сейчас</span>
        </div>
        <p className="text-sm text-white font-medium leading-snug">Новая запись: Анна</p>
        <p className="text-xs leading-snug" style={{ color: '#d4d4d8' }}>Маникюр + покрытие, пт 14:30</p>
      </div>

      <div className="lp-notify absolute -left-3 sm:-left-16 -bottom-4 sm:bottom-16 rounded-full px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
        style={{ backgroundColor: '#052e1f', color: '#6ee7b7', border: '1px solid #065f46', animationDelay: '1.6s' }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#34d399' }} />
        Подтверждена
      </div>
    </div>
  )
}

function Marquee() {
  const row = [...SERVICES, ...SERVICES]
  const colors = ['#f472b6', '#c084fc', '#fbbf24', '#6ee7b7', '#93c5fd']
  return (
    <div className="py-5 overflow-hidden" style={{ borderTop: '1px solid #1f1f24', borderBottom: '1px solid #1f1f24' }} aria-hidden="true">
      <div className="lp-marquee-track flex w-max gap-8 whitespace-nowrap">
        {row.map((name, i) => (
          <span key={i} className="flex items-center gap-8 text-lg sm:text-xl font-semibold" style={{ color: '#e4e4e7' }}>
            {name}
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
          </span>
        ))}
      </div>
    </div>
  )
}

// Мини-журнал: три мастера, записи цветами статусов как в панели
function JournalMock() {
  const masters = [
    { name: 'Ольга', blocks: [{ top: 4, h: 30, c: '#34d399', t: 'Маникюр' }, { top: 42, h: 22, c: '#60a5fa', t: 'Педикюр' }, { top: 72, h: 20, c: '#f59e0b', t: 'Дизайн' }] },
    { name: 'Анна', blocks: [{ top: 10, h: 24, c: '#9ca3af', t: 'Брови' }, { top: 40, h: 34, c: '#34d399', t: 'Наращивание' }] },
    { name: 'Мария', blocks: [{ top: 0, h: 20, c: '#f87171', t: 'Не пришла' }, { top: 28, h: 26, c: '#f59e0b', t: 'Ресницы' }, { top: 62, h: 28, c: '#34d399', t: 'Маникюр' }] },
  ]
  const legend = [['#34d399', 'Подтверждена'], ['#f59e0b', 'Ждёт'], ['#60a5fa', 'Записал админ'], ['#9ca3af', 'Пришёл'], ['#f87171', 'Не пришёл']]
  return (
    <div aria-hidden="true">
      <div className="grid grid-cols-3 gap-2">
        {masters.map((m, mi) => (
          <div key={m.name}>
            <p className="text-xs mb-1.5 font-medium" style={{ color: '#d4d4d8' }}>{m.name}</p>
            <div className="relative h-40 md:h-[22rem] rounded-xl" style={{ backgroundColor: '#111114', backgroundImage: 'repeating-linear-gradient(to bottom, #232328 0 1px, transparent 1px 20%)' }}>
              {m.blocks.map((b, bi) => (
                <div key={bi} className="lp-block absolute left-1 right-1 rounded-md px-1.5 py-1 text-[11px] font-medium overflow-hidden"
                  style={{
                    '--lp-delay': `${200 + (mi * 3 + bi) * 90}ms`,
                    top: `${b.top}%`, height: `${b.h}%`,
                    backgroundColor: `color-mix(in srgb, ${b.c} 22%, #141417)`,
                    borderLeft: `3px solid ${b.c}`,
                    color: '#f4f4f5',
                  }}>
                  {b.t}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3">
        {legend.map(([c, label]) => (
          <span key={label} className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: '#d4d4d8' }}>
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c }} />{label}
          </span>
        ))}
      </div>
    </div>
  )
}

function ChatMock() {
  return (
    <div className="space-y-2" aria-hidden="true">
      <div className="lp-block rounded-2xl rounded-tl-sm px-3 py-2 text-xs max-w-[85%]" style={{ '--lp-delay': '150ms', backgroundColor: '#1e3a5f', color: '#e0f2fe' }}>
        Вы записаны в Nail Studio на пт, 14:30. Мастер — Ольга.
      </div>
      <div className="lp-block rounded-2xl rounded-tl-sm px-3 py-2 text-xs max-w-[85%]" style={{ '--lp-delay': '450ms', backgroundColor: '#1e3a5f', color: '#e0f2fe' }}>
        Напоминаем: завтра в 14:30. Ждём вас!
      </div>
      <div className="lp-block ml-auto rounded-2xl rounded-tr-sm px-3 py-2 text-xs max-w-[60%] text-right" style={{ '--lp-delay': '750ms', backgroundColor: '#3b2a5f', color: '#f3e8ff' }}>
        Спасибо, буду!
      </div>
    </div>
  )
}

function QrMock() {
  const [image, setImage] = useState(null)
  useEffect(() => {
    let alive = true
    import('qrcode')
      .then(QR => QR.toDataURL('https://timepoint.tech', { width: 240, margin: 1, color: { dark: '#111111', light: '#ffffff' } }))
      .then(data => { if (alive) setImage(data) })
      .catch(() => {})
    return () => { alive = false }
  }, [])
  return (
    <div className="flex items-center gap-4" aria-hidden="true">
      <div className="w-24 h-24 rounded-xl p-1.5 shrink-0" style={{ backgroundColor: '#ffffff', transform: 'rotate(-4deg)' }}>
        {image && <img src={image} alt="" className="w-full h-full" />}
      </div>
      <div className="min-w-0">
        <p className="text-xs mb-1" style={{ color: '#a1a1aa' }}>Ваша ссылка</p>
        <p className="text-xs font-semibold whitespace-nowrap rounded-lg px-2 py-1 inline-block" style={{ backgroundColor: '#2a1830', color: '#f9a8d4' }}>nail-studio.timepoint.tech</p>
      </div>
    </div>
  )
}

function ClientsMock() {
  const rows = [
    { n: 'Анна К.', v: '12 визитов', badge: null },
    { n: 'Ирина М.', v: '5 визитов', badge: ['Долг 150 лей', '#fbbf24', '#3a2a0a'] },
    { n: 'Виктория С.', v: '2 неявки', badge: ['Чёрный список', '#fca5a5', '#3b1414'] },
  ]
  return (
    <ul className="space-y-2" aria-hidden="true">
      {rows.map((r, i) => (
        <li key={r.n} className="lp-block flex items-center justify-between gap-2 rounded-xl px-3 py-2" style={{ '--lp-delay': `${150 + i * 120}ms`, backgroundColor: '#111114' }}>
          <span className="min-w-0">
            <span className="block text-sm text-white truncate">{r.n}</span>
            <span className="block text-[11px]" style={{ color: '#a1a1aa' }}>{r.v}</span>
          </span>
          {r.badge && (
            <span className="text-[11px] font-semibold rounded-full px-2 py-0.5 whitespace-nowrap" style={{ color: r.badge[1], backgroundColor: r.badge[2] }}>{r.badge[0]}</span>
          )}
        </li>
      ))}
    </ul>
  )
}

function CashMock() {
  const bars = [42, 58, 35, 70, 88, 100, 64]
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
  return (
    <div aria-hidden="true">
      <p className="text-2xl font-bold text-white">18 450 <span className="text-sm font-medium" style={{ color: '#a1a1aa' }}>лей за неделю</span></p>
      <div className="flex items-end gap-2 h-24 mt-3">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <div className="lp-bar w-full rounded-md" style={{ '--lp-delay': `${i * 70}ms`, height: `${h}%`, background: i === 5 ? 'linear-gradient(180deg, #fbbf24, #f59e0b)' : 'linear-gradient(180deg, #a78bfa, #7c3aed)' }} />
            <span className="text-[10px]" style={{ color: '#a1a1aa' }}>{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LangMock() {
  const [ro, setRo] = useState(false)
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return undefined
    const timer = setInterval(() => setRo(v => !v), 2600)
    return () => clearInterval(timer)
  }, [])
  return (
    <div aria-hidden="true">
      <div className="inline-flex rounded-full p-1" style={{ backgroundColor: '#111114' }}>
        {['RU', 'RO'].map(code => {
          const active = (code === 'RO') === ro
          return (
            <span key={code} className="px-3 py-1 rounded-full text-xs font-bold transition-colors duration-300"
              style={{ backgroundColor: active ? '#0f766e' : 'transparent', color: active ? '#ffffff' : '#a1a1aa' }}>{code}</span>
          )
        })}
      </div>
      <p className="text-lg font-semibold text-white mt-3 transition-opacity duration-300">{ro ? 'Programează-te online' : 'Записаться онлайн'}</p>
    </div>
  )
}

const FEATURES = [
  { key: 'journal', span: 'md:col-span-2 md:row-span-2', accent: '#34d399', title: 'Журнал записей', text: 'Неделя по мастерам. Цвет записи сразу говорит, что с ней: ждёт подтверждения, подтверждена, клиент пришёл или нет.', mock: <JournalMock /> },
  { key: 'tg', accent: '#60a5fa', title: 'Telegram', text: 'Вам — новые записи и отмены. Клиентам — подтверждение и напоминание.', mock: <ChatMock /> },
  { key: 'qr', accent: '#f472b6', title: 'Ссылка и QR-код', text: 'Для Instagram, карт и ресепшена. Приложение клиентам не нужно.', mock: <QrMock /> },
  { key: 'clients', accent: '#f87171', title: 'База клиентов', text: 'История визитов, долги и чёрный список для тех, кто не приходит.', mock: <ClientsMock /> },
  { key: 'cash', accent: '#a78bfa', title: 'Касса и зарплаты', text: 'Оплата визитов, выручка и расчёт зарплат мастеров.', mock: <CashMock /> },
  { key: 'lang', accent: '#2dd4bf', title: 'Русский и румынский', text: 'Клиент выбирает язык сайта записи сам.', mock: <LangMock /> },
]

export default function LandingPage() {
  const rootRef = useRef(null)
  useReveal(rootRef)

  useEffect(() => {
    const previous = document.title
    document.title = 'TimePoint — онлайн-запись клиентов'
    return () => { document.title = previous }
  }, [])

  return (
    <div ref={rootRef} className="lp min-h-dvh relative">
      <div className="lp-glow" aria-hidden="true" />

      <header className="sticky top-0 z-20" style={{ backgroundColor: 'rgba(14, 14, 17, 0.72)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Logo />
          <nav aria-label="Основное" className="flex items-center gap-1 sm:gap-3">
            <a href="#features" className="hidden sm:inline-flex text-sm min-h-[44px] items-center px-2" style={{ color: '#d4d4d8' }}>Возможности</a>
            <a href="#faq" className="hidden sm:inline-flex text-sm min-h-[44px] items-center px-2" style={{ color: '#d4d4d8' }}>Вопросы</a>
            <Link to={LOGIN} className="text-sm min-h-[44px] inline-flex items-center px-3 rounded-xl font-medium text-white" style={{ border: '1px solid #3f3f46' }}>
              Войти
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative">
        <section className="max-w-6xl mx-auto px-4 pt-12 pb-16 sm:pt-20 sm:pb-24 grid gap-14 md:grid-cols-[1.1fr_1fr] items-center">
          <div className="text-center md:text-left">
            <p className="lp-reveal inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium mb-5"
              style={{ backgroundColor: 'rgba(219, 39, 119, 0.12)', color: '#f9a8d4', border: '1px solid rgba(219, 39, 119, 0.35)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#f472b6' }} />
              Онлайн-запись · журнал · клиенты
            </p>
            <h1 className="lp-reveal text-white text-4xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight" style={{ '--lp-delay': '80ms' }}>
              Клиенты записываются сами. <span className="lp-gradient-text">Вы занимаетесь делом.</span>
            </h1>
            <p className="lp-reveal text-base sm:text-lg mt-5 max-w-xl mx-auto md:mx-0" style={{ color: '#d4d4d8', '--lp-delay': '160ms' }}>
              Клиенты выбирают услугу, мастера и время со своего телефона. Вы видите все записи
              в одном журнале и получаете уведомления в Telegram.
            </p>
            <div className="lp-reveal mt-8 flex flex-col sm:flex-row items-center gap-3 md:justify-start justify-center" style={{ '--lp-delay': '240ms' }}>
              <CtaLink className="w-full sm:w-auto" />
              <a href="#how" className="w-full sm:w-auto min-h-[52px] px-6 rounded-2xl inline-flex items-center justify-center text-base font-medium text-white"
                style={{ border: '1px solid #3f3f46', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                Как это работает
              </a>
            </div>
            <ul className="lp-reveal mt-6 flex flex-wrap gap-x-5 gap-y-2 justify-center md:justify-start text-sm" style={{ color: '#d4d4d8', '--lp-delay': '320ms' }}>
              {[['#34d399', '14 дней бесплатно'], ['#fbbf24', 'Без банковской карты'], ['#c084fc', 'Настройка за вечер']].map(([c, t]) => (
                <li key={t} className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />{t}
                </li>
              ))}
            </ul>
          </div>
          <HeroPhone />
        </section>

        <Marquee />

        <section id="how" className="max-w-6xl mx-auto px-4 py-20 scroll-mt-16" aria-labelledby="how-title">
          <h2 id="how-title" className="lp-reveal text-white text-3xl sm:text-4xl font-bold text-center">От регистрации до первой записи</h2>
          <p className="lp-reveal text-center mt-3 mb-12" style={{ color: '#a1a1aa', '--lp-delay': '80ms' }}>Без установки, без звонков в поддержку.</p>
          <ol className="relative grid gap-5 md:grid-cols-3 list-none p-0 m-0">
            <span className="hidden md:block absolute top-[34px] left-[16%] right-[16%] h-px" aria-hidden="true"
              style={{ background: 'linear-gradient(90deg, #f472b6, #c084fc, #fbbf24)' }} />
            {STEPS.map((step, i) => (
              <li key={step.title} className="lp-reveal relative" style={{ '--lp-delay': `${i * 120}ms` }}>
                <div className="lp-card rounded-3xl p-6 h-full" style={{ '--lp-accent': step.color }}>
                  <span className="inline-block rounded-full px-3 py-1 text-xs font-bold mb-4"
                    style={{ color: '#0e0e11', backgroundColor: step.color }}>{step.tag}</span>
                  <h3 className="text-white text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#d4d4d8' }}>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="features" className="max-w-6xl mx-auto px-4 pb-20 scroll-mt-16" aria-labelledby="features-title">
          <h2 id="features-title" className="lp-reveal text-white text-3xl sm:text-4xl font-bold text-center mb-12">
            Всё для работы — <span className="lp-gradient-text">в одном месте</span>
          </h2>
          <ul className="grid gap-5 md:grid-cols-3 list-none p-0 m-0">
            {FEATURES.map((f, i) => (
              <li key={f.key} className={`lp-reveal ${f.span || ''}`} style={{ '--lp-delay': `${(i % 3) * 100}ms` }}>
                <div className="lp-card rounded-3xl p-6 h-full flex flex-col" style={{ '--lp-accent': f.accent }}>
                  <span className="w-8 h-1.5 rounded-full mb-4" style={{ backgroundColor: f.accent }} aria-hidden="true" />
                  <h3 className="text-white text-lg font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed mt-1.5 mb-5" style={{ color: '#d4d4d8' }}>{f.text}</p>
                  <div className="mt-auto">{f.mock}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section id="faq" className="max-w-3xl mx-auto px-4 pb-20 scroll-mt-16" aria-labelledby="faq-title">
          <h2 id="faq-title" className="lp-reveal text-white text-3xl sm:text-4xl font-bold text-center mb-10">Частые вопросы</h2>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <details key={item.q} className="lp-faq lp-reveal lp-card rounded-2xl" style={{ '--lp-delay': `${i * 80}ms`, '--lp-accent': '#c084fc' }}>
                <summary className="flex items-center justify-between gap-4 px-5 py-4 min-h-[56px] text-white font-semibold">
                  {item.q}
                  <span className="lp-chevron text-2xl leading-none" style={{ color: '#f472b6' }} aria-hidden="true">+</span>
                </summary>
                <p className="px-5 pb-5 -mt-1 text-sm leading-relaxed" style={{ color: '#d4d4d8' }}>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 pb-20">
          <div className="lp-reveal relative overflow-hidden rounded-[32px] px-6 py-14 sm:py-16 text-center"
            style={{ background: 'linear-gradient(120deg, #9d174d 0%, #6b21a8 55%, #92400e 100%)' }}>
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
              style={{ background: 'radial-gradient(50% 80% at 85% 0%, rgba(251, 191, 36, 0.25), transparent 70%), radial-gradient(40% 70% at 10% 100%, rgba(244, 114, 182, 0.3), transparent 70%)' }} />
            <h2 className="relative text-white text-3xl sm:text-4xl font-bold">Готовы принимать записи онлайн?</h2>
            <p className="relative mt-3 text-base sm:text-lg" style={{ color: '#fdf2f8' }}>Создайте салон за две минуты. Первые 14 дней бесплатно.</p>
            <div className="relative mt-8 flex justify-center">
              <Link to={SIGNUP} className="inline-flex items-center gap-2 min-h-[52px] px-8 rounded-2xl text-base font-semibold transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: '#ffffff', color: '#831843' }}>
                Начать работу <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 flex flex-wrap items-center justify-between gap-3 text-sm"
        style={{ borderTop: '1px solid #1f1f24', color: '#a1a1aa' }}>
        <Logo />
        <nav aria-label="Документы" className="flex gap-4">
          <Link to="/admin-panel/terms" className="hover:text-white min-h-[44px] inline-flex items-center">Правила сервиса</Link>
          <Link to={LOGIN} className="hover:text-white min-h-[44px] inline-flex items-center">Вход для салонов</Link>
        </nav>
      </footer>
    </div>
  )
}
