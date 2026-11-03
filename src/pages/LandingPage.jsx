import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ButtonLink } from '../admin/components/ui'

// Страница продукта: что это, как начать и кнопка «Начать работу» → регистрация салона.
// Открывается на /welcome, а на домене timepoint.tech — как главная (см. App.jsx).
// Тексты — на русском (владельцы салонов); клиентский сайт записи — отдельно, на RU/RO.

const STEPS = [
  { title: 'Создайте салон', text: 'Название, email и пароль — две минуты. Ссылка на запись появится сразу.' },
  { title: 'Настройте под себя', text: 'Услуги и цены, мастера, графики. Подсказки по шагам — в «Начале работы».' },
  { title: 'Поделитесь ссылкой', text: 'Поставьте её в Instagram, на карты и на ресепшен — клиенты записываются сами.' },
]

const FEATURES = [
  { title: 'Запись по ссылке и QR-коду', text: 'Клиент выбирает услугу, мастера и время со своего телефона. Приложение ставить не нужно.' },
  { title: 'Журнал записей', text: 'Неделя целиком по мастерам: подтверждение, перенос, отмена, статусы визитов по цветам.' },
  { title: 'Уведомления в Telegram', text: 'Новые записи и отмены приходят вам, напоминания — клиентам.' },
  { title: 'База клиентов', text: 'История визитов, заметки, долги и чёрный список для тех, кто не приходит.' },
  { title: 'Касса и зарплаты', text: 'Оплата визитов, отчёт по выручке и расчёт зарплат мастеров.' },
  { title: 'Русский и румынский', text: 'Сайт записи для клиентов работает на двух языках.' },
]

const FAQ = [
  { q: 'Сколько это стоит?', a: 'Первые 14 дней — бесплатно, банковская карта не нужна. О стоимости после пробного периода мы сообщим заранее.' },
  { q: 'Нужен ли свой сайт?', a: 'Нет. Вы получаете готовую страницу записи со своим названием, фото и адресом.' },
  { q: 'Что нужно клиентам?', a: 'Только телефон и ссылка. Регистрироваться и скачивать приложение им не нужно.' },
  { q: 'Можно ли попробовать без обязательств?', a: 'Да. Пробный период ничего не ограничивает; настроить салон можно за один вечер.' },
]

const card = { backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e' }

function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5 text-white font-bold text-lg">
      <span className="w-9 h-9 rounded-xl flex items-center justify-center text-sm" aria-hidden="true"
        style={{ background: 'linear-gradient(135deg, #db2777, #9333ea)' }}>TP</span>
      TimePoint
    </span>
  )
}

export default function LandingPage() {
  useEffect(() => {
    const previous = document.title
    document.title = 'TimePoint — онлайн-запись для салонов красоты'
    return () => { document.title = previous }
  }, [])

  return (
    <div className="min-h-dvh" style={{ backgroundColor: '#111111' }}>
      <header className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Logo />
        <Link to="/admin-panel/login" className="text-sm text-gray-300 hover:text-white min-h-[44px] inline-flex items-center px-2">
          Войти
        </Link>
      </header>

      <main>
        <section className="max-w-3xl mx-auto px-4 pt-10 pb-14 sm:pt-16 text-center">
          <h1 className="text-white text-3xl sm:text-5xl font-bold leading-tight">
            Онлайн-запись для салона красоты
          </h1>
          <p className="text-gray-300 text-base sm:text-lg mt-4 max-w-xl mx-auto">
            Клиенты записываются сами по ссылке из Instagram, а вы видите все записи в одном журнале.
            Без звонков и переписок.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <ButtonLink to="/admin-panel/signup" variant="primary" className="w-full sm:w-auto !px-8 !min-h-[52px] !text-base">
              Начать работу
            </ButtonLink>
            <p className="text-gray-400 text-sm">14 дней бесплатно. Банковская карта не нужна.</p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 py-10" aria-labelledby="how">
          <h2 id="how" className="text-white text-2xl font-bold text-center mb-8">Как начать</h2>
          <ol className="grid gap-4 sm:grid-cols-3 list-none p-0 m-0">
            {STEPS.map(step => (
              <li key={step.title} className="rounded-2xl p-5" style={card}>
                <h3 className="text-white font-semibold mb-1.5">{step.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="max-w-5xl mx-auto px-4 py-10" aria-labelledby="features">
          <h2 id="features" className="text-white text-2xl font-bold text-center mb-8">Всё, что нужно салону</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 list-none p-0 m-0">
            {FEATURES.map(item => (
              <li key={item.title} className="rounded-2xl p-5" style={card}>
                <h3 className="text-white font-semibold mb-1.5">{item.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{item.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="max-w-3xl mx-auto px-4 py-10" aria-labelledby="faq">
          <h2 id="faq" className="text-white text-2xl font-bold text-center mb-8">Частые вопросы</h2>
          <div className="space-y-3">
            {FAQ.map(item => (
              <div key={item.q} className="rounded-2xl p-5" style={card}>
                <h3 className="text-white font-semibold mb-1.5">{item.q}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-4 pt-10 pb-16 text-center">
          <h2 className="text-white text-2xl font-bold">Готовы принимать записи онлайн?</h2>
          <p className="text-gray-300 mt-2">Создайте салон за две минуты — первые 14 дней бесплатно.</p>
          <div className="mt-6 flex justify-center">
            <ButtonLink to="/admin-panel/signup" variant="primary" className="w-full sm:w-auto !px-8 !min-h-[52px] !text-base">
              Начать работу
            </ButtonLink>
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-8 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-400"
        style={{ borderTop: '1px solid #2e2e2e' }}>
        <Logo />
        <nav aria-label="Документы" className="flex gap-4">
          <Link to="/admin-panel/terms" className="hover:text-white min-h-[44px] inline-flex items-center">Правила сервиса</Link>
          <Link to="/admin-panel/login" className="hover:text-white min-h-[44px] inline-flex items-center">Войти</Link>
        </nav>
      </footer>
    </div>
  )
}
