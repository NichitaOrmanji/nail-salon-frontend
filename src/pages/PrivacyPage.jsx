import { useNavigate } from 'react-router-dom'
import { useCompany } from '../context/CompanyContext'

// Черновик политики по Закону РМ № 133/2011 «О защите персональных данных».
// [В квадратных скобках] — данные, которые владелец сервиса должен вписать сам.
const UPDATED = '29 октября 2026'

function Section({ title, children }) {
  return (
    <section className="mb-6">
      <h2 className="text-white text-base font-semibold mb-2">{title}</h2>
      <div className="text-gray-300 text-sm leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  const navigate = useNavigate()
  const company = useCompany()

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: '#242424' }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Назад"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400"
          style={{ backgroundColor: '#242424' }}
        >
          ‹
        </button>
        <div className="text-white text-sm font-semibold">Политика конфиденциальности</div>
      </div>

      <div className="px-6 py-6">
        <p className="text-gray-500 text-xs mb-6">Редакция от {UPDATED}</p>

        <Section title="1. Кто обрабатывает данные">
          <p>
            Оператор персональных данных — салон «{company.name}» ({company.address}{company.phone ? `, тел. ${company.phone}` : ''}),
            в который вы записываетесь.
          </p>
          <p>
            Онлайн-запись работает на сервисе TimePoint ([наименование ÎI / компании], IDNO [номер],
            [адрес], [email для обращений]), который обрабатывает данные по поручению салона.
          </p>
        </Section>

        <Section title="2. Какие данные мы получаем">
          <p>Имя и фамилия, номер телефона, email (если указан), комментарий к записи, выбранные услуга, мастер, дата и время.</p>
          <p>Если вы подключаете Telegram — идентификатор чата с ботом и имя из Telegram.</p>
          <p>Для входа в личный кабинет — номер телефона и пароль (хранится только в зашифрованном виде) или подтверждение через Telegram.</p>
        </Section>

        <Section title="3. Зачем">
          <p>Чтобы записать вас к мастеру, подтвердить запись, напомнить о визите, сообщить об изменениях и вести историю ваших визитов в салоне.</p>
          <p>Мы не продаём данные и не используем их для рекламы третьих лиц.</p>
        </Section>

        <Section title="4. Основание">
          <p>Ваше согласие, которое вы даёте при записи, и исполнение договора об оказании услуги (ст. 5 Закона РМ № 133/2011).</p>
        </Section>

        <Section title="5. Кому передаются данные">
          <p>Только сотрудникам салона, которые работают с вашей записью, и поставщикам, без которых сервис не работает:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Oracle Cloud (сервер и база данных, Франкфурт, ЕС);</li>
            <li>Vercel (сайт записи);</li>
            <li>Telegram — только если вы сами подключили бота;</li>
            <li>Cloudinary (фотографии салона и мастеров, ваших данных там нет).</li>
          </ul>
        </Section>

        <Section title="6. Сколько храним">
          <p>
            Пока вы пользуетесь услугами салона и [3 года] после последнего визита — для истории посещений.
            Служебные сообщения Telegram-бота удаляются через 30 дней. По вашему запросу данные удаляются раньше.
          </p>
        </Section>

        <Section title="7. Ваши права">
          <p>
            Вы можете узнать, какие данные о вас хранятся, исправить или удалить их, отозвать согласие.
            Напишите или позвоните в салон{company.phone ? ` (${company.phone})` : ''} или на [email для обращений].
            Мы ответим в течение 15 дней.
          </p>
          <p>
            Если считаете, что ваши права нарушены, вы можете обратиться в Национальный центр по защите персональных данных (datepersonale.md).
          </p>
        </Section>

        <Section title="8. Как защищаем">
          <p>Соединение шифруется (HTTPS), доступ сотрудников — по личным паролям с ролями, резервные копии базы шифруются.</p>
        </Section>

        <Section title="9. Хранилище браузера">
          <p>Сайт сохраняет в вашем браузере имя и телефон (чтобы не вводить их заново) и данные входа. Рекламных и аналитических cookie нет.</p>
        </Section>
      </div>
    </div>
  )
}
