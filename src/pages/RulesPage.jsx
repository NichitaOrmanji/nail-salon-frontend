import { Link, useNavigate } from 'react-router-dom'
import { useCompany } from '../context/CompanyContext'
import { t } from '../i18n'

// Правила салона для клиентов. Цифры (сроки, процент штрафа) берутся из настроек
// салона в панели, поэтому страница всегда совпадает с тем, как работает запись.

function Rule({ icon, title, children }) {
  return (
    <section className="rounded-2xl p-5 mb-3" style={{ backgroundColor: '#242424' }}>
      <h2 className="text-white text-base font-semibold mb-2">
        <span className="mr-2" aria-hidden="true">{icon}</span>{title}
      </h2>
      <div className="text-gray-300 text-sm leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

export default function RulesPage() {
  const navigate = useNavigate()
  const company = useCompany()
  const cancelHours = Number(company.cancel_hours) || 0
  const percent = Number(company.penalty_percent) || 0
  const lateHours = Number(company.late_cancel_hours) || 0

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
        <div className="text-white text-sm font-semibold">{t('Правила салона')}</div>
      </div>

      <div className="px-6 py-6">
        <p className="text-gray-400 text-sm mb-5">
          {t('Правила салона «{name}» для онлайн-записи. Записываясь, вы соглашаетесь с ними.', { name: company.name })}
        </p>

        <Rule icon="📅" title={t('Запись')}>
          <p>
            {company.auto_confirm
              ? t('Запись с сайта подтверждается сразу — вы увидите это на экране после записи.')
              : t('Запись с сайта салон подтверждает сам; при необходимости вам позвонят по указанному номеру. Если у вас есть Telegram, можно подтвердить запись там сразу.')}
          </p>
          <p>{t('Пожалуйста, приходите вовремя. При опоздании мастер может не успеть выполнить услугу полностью, а запись может быть перенесена.')}</p>
          <p>{t('Онлайн можно иметь не больше 3 предстоящих записей. Чтобы записаться ещё, позвоните в салон.')}</p>
        </Rule>

        <Rule icon="↩️" title={t('Отмена и перенос')}>
          <p>
            {cancelHours > 0
              ? t('Отменить запись самостоятельно можно в личном кабинете или в Telegram не позже чем за {hours} ч до визита. Позже — только по телефону салона.', { hours: cancelHours })
              : t('Отменить запись можно в личном кабинете или в Telegram в любое время до визита, а также по телефону салона.')}
          </p>
          <p>{t('Чтобы перенести запись, позвоните в салон или отмените её и запишитесь на новое время.')}</p>
        </Rule>

        {percent > 0 && (
          <Rule icon="⛔" title={t('Неявка и поздняя отмена — чёрный список')}>
            <p>
              {lateHours > 0
                ? t('Если вы не пришли, не предупредив, или отменили запись меньше чем за {hours} ч до визита, вы попадаете в чёрный список салона и начисляется штраф {percent}% стоимости пропущенной услуги.', { hours: lateHours, percent })
                : t('Если вы не пришли, не предупредив, вы попадаете в чёрный список салона и начисляется штраф {percent}% стоимости пропущенной услуги.', { percent })}
            </p>
            <p>{t('Штраф оплачивается только на месте в салоне — при следующем визите, вместе с оплатой услуги. Онлайн-оплаты нет. Запись при этом не блокируется.')}</p>
            <p>{t('Неоплаченный штраф виден в личном кабинете. Решение об отмене штрафа принимает салон.')}</p>
          </Rule>
        )}

        <Rule icon="💳" title={t('Оплата')}>
          <p>{t('Услуги оплачиваются в салоне после визита. Цены на сайте указаны в леях.')}</p>
        </Rule>

        <Rule icon="🔒" title={t('Ваши данные')}>
          <p>
            {t('Имя и телефон нужны только для записи и напоминаний.')}{' '}
            <Link to="/privacy" className="underline" style={{ color: '#f472b6' }}>{t('Политика конфиденциальности')}</Link>
          </p>
          <p>{t('Удалить свои данные можно в личном кабинете («Удалить аккаунт») или попросив салон.')}</p>
        </Rule>

        {company.phone && (
          <p className="text-gray-500 text-sm text-center mt-6">
            {t('Вопросы — по телефону салона:')}{' '}
            <a href={`tel:${company.phone.replace(/[^\d+]/g, '')}`} className="underline" style={{ color: '#f472b6' }}>{company.phone}</a>
          </p>
        )}
      </div>
    </div>
  )
}
