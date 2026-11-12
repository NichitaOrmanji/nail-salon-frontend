import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStaffAuth } from '../context/StaffAuthContext'
import { PageHeader } from '../components/ui'
import { IconChevronLeft } from '../components/Icons'
import { getLang, t } from '../../i18n'

// Инструкция для персонала салона. Названия кнопок — как в панели; меняя кнопку, обновите текст.

function Topic({ title, open, onToggle, children }) {
  return (
    <section className="rounded-2xl mb-2" style={{ backgroundColor: '#1f1f1f', border: '1px solid #2e2e2e' }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 min-h-[52px] text-left text-white text-sm font-semibold"
      >
        {title}
        <span className="text-gray-500" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="px-4 pb-4 text-gray-300 text-sm leading-relaxed space-y-2">{children}</div>}
    </section>
  )
}

const B = ({ children }) => <b className="text-white font-semibold">{children}</b>

const TOPICS = [
  {
    key: 'start',
    title: 'С чего начать (один раз)',
    managers: true,
    body: (
      <>
        <ol className="list-decimal pl-5 space-y-1">
          <li><B>О салоне</B>: название, адрес, телефон, фото, координаты для карты. <B>Настройки</B>: правила отмены и чёрного списка.</li>
          <li><B>Услуги</B>: категории и услуги с ценой и длительностью.</li>
          <li><B>Мастера</B> → <B>+ Мастер</B>: имя, фото, какие услуги делает. Там же — <B>Дать доступ</B> в панель (логин и пароль мастеру).</li>
          <li><B>Мастера → Графики</B>: рабочие дни и обед на месяц вперёд.</li>
          <li><B>Настройки</B> (внизу панели, ваше имя) → <B>Уведомления в Telegram</B>: новые записи и отмены будут приходить в Telegram салона.</li>
          <li><B>О салоне → Открыть сайт ↗</B> — запишитесь сами и проверьте, что всё видно правильно.</li>
          <li><B>О салоне</B> — чек-лист настройки и ваша ссылка для записи: копировать, QR-код, текст для соцсетей.</li>
        </ol>
      </>
    ),
  },
  {
    key: 'schedule',
    title: 'График мастеров и обед',
    body: (
      <>
        <p><B>Мастера → Графики</B> — месяц по дням. Выделите дни (или нажмите <B>Весь месяц</B>, <B>Будни</B>, <B>Сб и Вс</B>), выберите <B>Рабочий день</B>, <B>Выходной</B> или <B>Как в шаблоне</B>, укажите часы работы и обед → <B>Применить</B>.</p>
        <p>Шаблон недели и «Обед во все рабочие дни» — в карточке мастера. Что задано по датам, важнее шаблона.</p>
        <p>В обед и в выходной клиент на сайте не сможет записаться. Если в выбранный день уже есть записи, панель предупредит — перенесите их сами.</p>
        <p>Мастер с доступом видит свой график в пункте <B>Мой график</B>.</p>
      </>
    ),
  },
  {
    key: 'journal',
    title: 'Журнал: записи, подтверждение, перенос',
    body: (
      <>
        <p>Режимы <B>День</B> и <B>Неделя</B>, фильтр по мастеру, кнопка <B>Сегодня</B>. Новая запись — <B>+ Запись</B> или нажмите на свободное время.</p>
        <p>Онлайн-запись приходит со статусом «ждёт подтверждения», если в Настройках выключено автоподтверждение. Клиент может подтвердить её в Telegram; если у клиента нет Telegram — позвоните ему и нажмите <B>Подтвердить</B> в карточке записи.</p>
        <p>В карточке записи: <B>Пришёл</B>, <B>Не пришёл</B>, <B>Отменить</B>, <B>Перенести/изменить</B>, <B>Вернуть</B> (если отметили по ошибке). Клиенту с Telegram об отмене и переносе придёт сообщение.</p>
        <p>⛔ возле имени — клиент в чёрном списке.</p>
      </>
    ),
  },
  {
    key: 'payment',
    title: 'Оплата визита',
    body: (
      <>
        <p>В карточке записи → <B>Оплата</B>: способ (наличные, карта, перевод), скидка в % или леях → <B>Оплачено</B>. Запись отметится как «пришёл».</p>
        <p>Если у клиента есть неоплаченный штраф, в окне оплаты появится строка «Штраф из чёрного списка» — галочка добавит его к сумме.</p>
        <p>Ошиблись — <B>Отменить оплату</B> (только владелец).</p>
      </>
    ),
  },
  {
    key: 'blacklist',
    title: 'Неявка, поздняя отмена и чёрный список',
    body: (
      <>
        <p>Нажали <B>Не пришёл</B> (или отменяете запись меньше чем за N часов) — панель спросит: <B>В чёрный список, штраф …</B> или <B>Без штрафа</B> (уважительная причина).</p>
        <p>Если клиент сам поздно отменил на сайте или в Telegram — штраф начисляется автоматически.</p>
        <p>Штраф (процент из Настроек) клиент платит только в салоне при следующем визите. Записываться он может; при новой записи в Telegram салона придёт блок «Клиент в чёрном списке» с суммой.</p>
        <p><B>Клиенты → Должники</B> — все, кто должен, общая сумма и кто когда придёт (сверху — ближайшие визиты). Нажмите на клиента — в карточке штраф можно отметить оплаченным или простить.</p>
      </>
    ),
  },
  {
    key: 'clients',
    title: 'Клиенты',
    managers: true,
    body: (
      <>
        <p>Поиск по имени и телефону, история визитов, сумма оплат, любимый мастер, заметка о клиенте (видят только сотрудники).</p>
        <p><B>Записать снова</B> — откроет журнал с данными клиента.</p>
        <p>Клиент попросил удалить его данные — карточка клиента → <B>Удалить данные клиента</B>. Записи и оплаты останутся в отчётах без имени и телефона. Отменить нельзя.</p>
      </>
    ),
  },
  {
    key: 'finance',
    title: 'Финансы и зарплаты',
    owner: true,
    body: (
      <>
        <p><B>Финансы</B> видит только владелец. <B>Отчёт</B> — выручка за период по мастерам и дням. <B>Касса</B> — оплаты, приходы и расходы за день. <B>Зарплаты</B> — схема (процент и/или фикс в день), начислено, <B>Выплатить</B>.</p>
        <p>Мастер видит свои начисления в пункте <B>Моя зарплата</B>.</p>
      </>
    ),
  },
  {
    key: 'staff',
    title: 'Сотрудники и безопасность',
    managers: true,
    body: (
      <>
        <p>У каждого сотрудника свой логин и пароль: карточка мастера → <B>Дать доступ</B>. Уволился — <B>Отключить доступ</B> сразу.</p>
        <p>Пароль — не короче 8 символов, не «12345678» и не имя. Сменить свой — <B>Настройки → Сменить пароль</B>.</p>
        <p>Не пересылайте никому ссылку подключения Telegram и коды входа. После 5 неверных паролей вход блокируется на 15 минут.</p>
      </>
    ),
  },
  {
    key: 'problems',
    title: 'Если что-то не так',
    body: (
      <>
        <p><B>Клиент не может записаться на время</B> — проверьте график мастера на этот день (рабочий ли, нет ли обеда) и что у мастера отмечена услуга.</p>
        <p><B>Мастера или услуги нет на сайте</B> — мастер скрыт, у него нет активных услуг или услуга выключена.</p>
        <p><B>Не приходят уведомления в Telegram</B> — <B>Настройки → Уведомления в Telegram</B>, подключите заново.</p>
        <p><B>Клиент пишет, что «слишком много попыток»</B> — сработала защита от спама; через час можно снова, или запишите его сами через <B>+ Запись</B>.</p>
        <p><B>Вверху «Вышла новая версия панели»</B> — обновите страницу.</p>
        <p>Не помогло — напишите в поддержку TimePoint, приложите скриншот.</p>
      </>
    ),
  },
]

// Румынская версия инструкции (те же разделы и ключи, что в TOPICS)
const TOPICS_RO = [
  {
    key: 'start',
    title: 'Cu ce să începeți (o singură dată)',
    managers: true,
    body: (
      <ol className="list-decimal pl-5 space-y-1">
        <li><B>Despre salon</B>: denumirea, adresa, telefonul, fotografii, coordonatele pentru hartă. <B>Setări</B>: regulile de anulare și lista neagră.</li>
        <li><B>Servicii</B>: categorii și servicii cu preț și durată.</li>
        <li><B>Specialiști</B> → <B>+ Specialist</B>: nume, fotografie, ce servicii face. Tot acolo — <B>Oferă acces</B> în panou (login și parolă pentru specialist).</li>
        <li><B>Specialiști → Grafice</B>: zilele de lucru și pauza de masă pe o lună înainte.</li>
        <li><B>Setări</B> (jos în panou, numele dvs.) → <B>Notificări în Telegram</B>: programările noi și anulările vor veni în Telegram-ul salonului.</li>
        <li><B>Despre salon → Deschide site-ul ↗</B> — programați-vă singuri și verificați că totul se vede corect.</li>
        <li><B>Despre salon</B> — lista de configurare și linkul dvs. de programare: copiere, cod QR, text pentru rețele sociale.</li>
      </ol>
    ),
  },
  {
    key: 'schedule',
    title: 'Graficul specialiștilor și pauza de masă',
    body: (
      <>
        <p><B>Specialiști → Grafice</B> — luna pe zile. Selectați zilele (sau apăsați <B>Toată luna</B>, <B>Zile lucrătoare</B>, <B>Sâ și Du</B>), alegeți <B>Zi de lucru</B>, <B>Zi liberă</B> sau <B>Ca în șablon</B>, indicați orele de lucru și pauza → <B>Aplică</B>.</p>
        <p>Șablonul săptămânii și „Pauză în toate zilele de lucru” — în fișa specialistului. Ce e setat pe date are prioritate față de șablon.</p>
        <p>În pauză și în ziua liberă clientul nu se poate programa pe site. Dacă în ziua aleasă există deja programări, panoul vă va avertiza — mutați-le singuri.</p>
        <p>Specialistul cu acces își vede graficul în secțiunea <B>Programul meu</B>.</p>
      </>
    ),
  },
  {
    key: 'journal',
    title: 'Registru: programări, confirmare, mutare',
    body: (
      <>
        <p>Moduri <B>Zi</B> și <B>Săptămână</B>, filtru pe specialist, butonul <B>Astăzi</B>. Programare nouă — <B>+ Programare</B> sau apăsați pe o oră liberă.</p>
        <p>Programarea online vine cu statutul „așteaptă confirmare” dacă în Setări confirmarea automată e oprită. Clientul o poate confirma în Telegram; dacă nu are Telegram — sunați-l și apăsați <B>Confirmă</B> în fișa programării.</p>
        <p>În fișa programării: <B>A venit</B>, <B>Nu a venit</B>, <B>Anulează</B>, <B>Mută/modifică</B>, <B>Restabilește</B> (dacă ați marcat din greșeală). Clientul cu Telegram primește mesaj despre anulare și mutare.</p>
        <p>⛔ lângă nume — clientul e în lista neagră.</p>
      </>
    ),
  },
  {
    key: 'payment',
    title: 'Plata vizitei',
    body: (
      <>
        <p>În fișa programării → <B>Plată</B>: metoda (numerar, card, transfer), reducere în % sau lei → <B>Achitat</B>. Programarea se marchează „a venit”.</p>
        <p>Dacă clientul are o penalitate neachitată, în fereastra de plată apare rândul „Penalitate din lista neagră” — bifa o adaugă la sumă.</p>
        <p>Ați greșit — <B>Anulează plata</B> (doar proprietarul).</p>
      </>
    ),
  },
  {
    key: 'blacklist',
    title: 'Neprezentare, anulare târzie și lista neagră',
    body: (
      <>
        <p>Ați apăsat <B>Nu a venit</B> (sau anulați programarea cu mai puțin de N ore înainte) — panoul întreabă: <B>În lista neagră, penalitate …</B> sau <B>Fără penalitate</B> (motiv întemeiat).</p>
        <p>Dacă clientul a anulat târziu singur pe site sau în Telegram — penalitatea se aplică automat.</p>
        <p>Penalitatea (procentul din Setări) clientul o achită doar în salon la vizita următoare. Se poate programa; la o programare nouă în Telegram-ul salonului vine blocul „Client în lista neagră” cu suma.</p>
        <p><B>Clienți → Datornici</B> — toți cei care datorează, suma totală și cine când vine (sus — cele mai apropiate vizite). Apăsați pe client — în fișă penalitatea poate fi marcată achitată sau iertată.</p>
      </>
    ),
  },
  {
    key: 'clients',
    title: 'Clienți',
    managers: true,
    body: (
      <>
        <p>Căutare după nume și telefon, istoricul vizitelor, suma plăților, specialistul preferat, notiță despre client (o văd doar angajații).</p>
        <p><B>Programează din nou</B> — deschide registrul cu datele clientului.</p>
        <p>Clientul a cerut ștergerea datelor — fișa clientului → <B>Șterge datele clientului</B>. Programările și plățile rămân în rapoarte fără nume și telefon. Acțiunea e ireversibilă.</p>
      </>
    ),
  },
  {
    key: 'finance',
    title: 'Finanțe și salarii',
    owner: true,
    body: (
      <>
        <p><B>Finanțe</B> le vede doar proprietarul. <B>Raport</B> — încasările pe perioadă pe specialiști și zile. <B>Casa</B> — plăți, intrări și cheltuieli pe zi. <B>Salarii</B> — schema (procent și/sau fix pe zi), calculat, <B>Achită</B>.</p>
        <p>Specialistul își vede calculul în secțiunea <B>Salariul meu</B>.</p>
      </>
    ),
  },
  {
    key: 'staff',
    title: 'Angajați și securitate',
    managers: true,
    body: (
      <>
        <p>Fiecare angajat are login și parolă proprii: fișa specialistului → <B>Oferă acces</B>. A plecat — <B>Dezactivează accesul</B> imediat.</p>
        <p>Parola — minimum 8 caractere, nu „12345678” și nu numele. Schimbați-o pe a dvs. — <B>Setări → Schimbă parola</B>.</p>
        <p>Nu trimiteți nimănui linkul de conectare Telegram și codurile de intrare. După 5 parole greșite intrarea se blochează pe 15 minute.</p>
      </>
    ),
  },
  {
    key: 'problems',
    title: 'Dacă ceva nu merge',
    body: (
      <>
        <p><B>Clientul nu se poate programa la o oră</B> — verificați graficul specialistului în ziua respectivă (e zi de lucru, nu e pauză) și că specialistul are serviciul bifat.</p>
        <p><B>Specialistul sau serviciul lipsește pe site</B> — specialistul e ascuns, nu are servicii active sau serviciul e dezactivat.</p>
        <p><B>Nu vin notificările în Telegram</B> — <B>Setări → Notificări în Telegram</B>, conectați din nou.</p>
        <p><B>Clientul scrie „prea multe încercări”</B> — a funcționat protecția anti-spam; peste o oră se poate din nou, sau programați-l singuri prin <B>+ Programare</B>.</p>
        <p><B>Sus apare „A apărut o versiune nouă a panoului”</B> — reîncărcați pagina.</p>
        <p>Nu a ajutat — scrieți la suportul TimePoint, atașați o captură de ecran.</p>
      </>
    ),
  },
]

export default function HelpPage() {
  const { me, isManager } = useStaffAuth()
  const [open, setOpen] = useState(isManager ? 'start' : 'schedule')
  const all = getLang() === 'ro' ? TOPICS_RO : TOPICS
  const topics = all.filter(tp => (!tp.managers || isManager) && (!tp.owner || me?.role === 'owner'))

  return (
    <div className="px-4 md:px-6 py-5 max-w-3xl">
      <Link
        to="/admin-panel/settings"
        className="inline-flex items-center gap-1.5 min-h-[44px] -ml-1 pr-3 mb-1 rounded-xl text-sm font-semibold text-gray-300 hover:text-white"
      >
        <IconChevronLeft size={20} />
        {t('Настройки')}
      </Link>
      <PageHeader title={t('Помощь')} subtitle={t('Как работать в панели салона')} />
      {topics.map(tp => (
        <Topic key={tp.key} title={tp.title} open={open === tp.key} onToggle={() => setOpen(o => (o === tp.key ? null : tp.key))}>
          {tp.body}
        </Topic>
      ))}
    </div>
  )
}
