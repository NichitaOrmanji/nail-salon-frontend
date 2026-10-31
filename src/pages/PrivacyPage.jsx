import { useNavigate } from 'react-router-dom'
import { useCompany } from '../context/CompanyContext'
import { getLang, t } from '../i18n'

// Черновик политики по Закону РМ № 133/2011 «О защите персональных данных».
// [В квадратных скобках] — данные, которые владелец сервиса должен вписать сам.
// Румынская версия — перевод русской; меняя текст, меняйте обе.
const UPDATED = '29 октября 2026'
const UPDATED_RO = '29 octombrie 2026'

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
          aria-label={t('Назад')}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400"
          style={{ backgroundColor: '#242424' }}
        >
          ‹
        </button>
        <div className="text-white text-sm font-semibold">{t('Политика конфиденциальности')}</div>
      </div>

      {getLang() === 'ro' ? (
        <>
      <div className="px-6 py-6">
        <p className="text-gray-500 text-xs mb-6">Redacția din {UPDATED_RO}</p>

        <Section title="1. Cine prelucrează datele">
          <p>
            Operatorul de date cu caracter personal este salonul «{company.name}» ({company.address}{company.phone ? `, tel. ${company.phone}` : ''}),
            la care vă programați.
          </p>
          <p>
            Programarea online funcționează pe serviciul TimePoint ([denumirea ÎI / companiei], IDNO [număr],
            [adresa], [email pentru solicitări]), care prelucrează datele în numele salonului.
          </p>
        </Section>

        <Section title="2. Ce date primim">
          <p>Numele și prenumele, numărul de telefon, emailul (dacă este indicat), comentariul la programare, serviciul, maestrul, data și ora alese.</p>
          <p>Dacă conectați Telegram — identificatorul conversației cu botul și numele din Telegram.</p>
          <p>Pentru intrarea în contul personal — numărul de telefon și parola (păstrată doar criptat) sau confirmarea prin Telegram.</p>
        </Section>

        <Section title="3. În ce scop">
          <p>Pentru a vă programa la maestru, a confirma programarea, a vă reaminti de vizită, a vă anunța despre modificări și a păstra istoricul vizitelor în salon.</p>
          <p>Nu vindem datele și nu le folosim pentru publicitatea terților.</p>
        </Section>

        <Section title="4. Temeiul">
          <p>Acordul dvs., pe care îl dați la programare, și executarea contractului de prestare a serviciului (art. 5 al Legii RM nr. 133/2011).</p>
        </Section>

        <Section title="4.1. Neprezentări și anulări târzii">
          <p>
            Dacă nu v-ați prezentat la programare sau ați anulat-o mai târziu de termenul stabilit de salon, salonul
            marchează acest lucru și aplică o amendă (o parte din prețul serviciului ratat), care se achită la salon
            la următoarea vizită. Această mențiune se păstrează în salon, este vizibilă doar angajaților lui și nu se
            transmite altor saloane. Termenul de păstrare — ca pentru istoricul vizitelor; salonul poate elimina mențiunea
            la cererea dvs.
          </p>
        </Section>

        <Section title="5. Cui se transmit datele">
          <p>Doar angajaților salonului care lucrează cu programarea dvs. și furnizorilor fără de care serviciul nu funcționează:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Oracle Cloud (serverul și baza de date, Frankfurt, UE);</li>
            <li>Vercel (site-ul de programări);</li>
            <li>Telegram — doar dacă ați conectat singuri botul;</li>
            <li>Cloudinary (fotografiile salonului și ale maeștrilor, datele dvs. nu sunt acolo).</li>
          </ul>
        </Section>

        <Section title="6. Cât timp păstrăm">
          <p>
            Cât timp folosiți serviciile salonului și [3 ani] după ultima vizită — pentru istoricul vizitelor.
            Mesajele de serviciu ale botului Telegram se șterg după 30 de zile. La cererea dvs. datele se șterg mai devreme.
          </p>
        </Section>

        <Section title="7. Drepturile dvs.">
          <p>
            Puteți afla ce date despre dvs. sunt păstrate, le puteți corecta sau șterge și vă puteți retrage acordul.
            Scrieți sau sunați la salon{company.phone ? ` (${company.phone})` : ''} sau la [email pentru solicitări].
            Vă vom răspunde în termen de 15 zile.
          </p>
          <p>
            Dacă considerați că drepturile dvs. au fost încălcate, vă puteți adresa Centrului Național pentru Protecția Datelor cu Caracter Personal (datepersonale.md).
          </p>
        </Section>

        <Section title="8. Cum protejăm datele">
          <p>Conexiunea este criptată (HTTPS), accesul angajaților — prin parole personale cu roluri, copiile de rezervă ale bazei de date sunt criptate.</p>
        </Section>

        <Section title="9. Memoria browserului">
          <p>Site-ul păstrează în browserul dvs. numele și telefonul (ca să nu le introduceți din nou) și datele de autentificare. Nu există cookie-uri de publicitate sau analiză.</p>
        </Section>
      </div>
        </>
      ) : (
        <>
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

        <Section title="4.1. Неявки и поздние отмены">
          <p>
            Если вы не пришли на запись или отменили её позже срока, установленного салоном, салон отмечает это
            и начисляет штраф (доля стоимости пропущенной услуги), который оплачивается на месте при следующем визите.
            Эта отметка хранится в салоне, видна только его сотрудникам и другим салонам не передаётся.
            Срок хранения — как у истории визитов; салон может снять отметку по вашему обращению.
          </p>
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
        </>
      )}
    </div>
  )
}
