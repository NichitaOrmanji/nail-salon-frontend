import { useState } from 'react'
import { useStaffAuth } from '../context/StaffAuthContext'
import { ROLE_LABELS } from '../utils/statuses'
import ChangePasswordModal from '../components/ChangePasswordModal'
import TelegramModal from '../components/TelegramModal'
import { IconLogout, IconHelp } from '../components/Icons'
import SalonForm from '../components/SalonForm'
import { Link } from 'react-router-dom'
import { LANGS, setLang, t, useLang } from '../../i18n'
import { Button, PageHeader } from '../components/ui'

// Аккаунт сотрудника: кто вошёл, уведомления в Telegram, пароль, выход
function AccountSection() {
  const { me, logout } = useStaffAuth()
  const [telegramOpen, setTelegramOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  return (
    <section aria-labelledby="account-title" className="rounded-2xl p-4 mb-6" style={{ backgroundColor: '#1f1f1f', border: '1px solid #2e2e2e' }}>
      <h2 id="account-title" className="text-white text-base font-semibold mb-3">{t('Аккаунт')}</h2>
      <div className="flex items-center gap-3 mb-4">
        <span className="w-11 h-11 rounded-full flex items-center justify-center text-base font-semibold flex-shrink-0" style={{ backgroundColor: '#2e1f28', color: '#f472b6' }}>
          {(me.name || me.username || '?').trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <div className="text-white text-sm font-medium truncate">{me.name || me.username}</div>
          <div className="text-gray-400 text-xs">{t(ROLE_LABELS[me.role] || me.role)}{me.email ? ` · ${me.email}` : ''}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setTelegramOpen(true)}>{t('Уведомления в Telegram')}</Button>
        <Button onClick={() => setPasswordOpen(true)}>{t('Сменить пароль')}</Button>
        <Button onClick={logout} style={{ color: '#f87171' }}>
          <span className="inline-flex items-center gap-2"><IconLogout size={16} />{t('Выйти')}</span>
        </Button>
      </div>
      <LanguagePicker />
      {telegramOpen && <TelegramModal onClose={() => setTelegramOpen(false)} />}
      {passwordOpen && <ChangePasswordModal onClose={() => setPasswordOpen(false)} />}
    </section>
  )
}

const LANG_NAMES = { ru: 'Русский', ro: 'Română' }

// Язык интерфейса панели (у сайта записи — свой переключатель для клиентов)
function LanguagePicker() {
  const lang = useLang()
  return (
    <div className="mt-4 pt-4" style={{ borderTop: '1px solid #2e2e2e' }}>
      <div id="ui-lang" className="text-gray-400 text-xs mb-2">{t('Язык интерфейса')}</div>
      <div role="radiogroup" aria-labelledby="ui-lang" className="inline-flex rounded-xl overflow-hidden" style={{ border: '1px solid #2e2e2e' }}>
        {LANGS.map(code => (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={lang === code}
            onClick={() => setLang(code)}
            className="min-h-[40px] px-4 text-sm font-medium"
            style={{ backgroundColor: lang === code ? '#db2777' : '#242424', color: lang === code ? '#ffffff' : '#9ca3af' }}
          >
            {LANG_NAMES[code]}
          </button>
        ))}
      </div>
    </div>
  )
}

// Большая заметная кнопка «Помощь»
function HelpButton() {
  return (
    <Link
      to="/admin-panel/help"
      className="flex items-center gap-4 rounded-2xl p-4 mb-6 transition-all active:scale-[0.99]"
      style={{ backgroundColor: '#2e1f28', border: '1px solid #db2777' }}
    >
      <span className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#db2777', color: '#ffffff' }}>
        <IconHelp size={26} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-white text-base font-semibold">{t('Помощь')}</span>
        <span className="block text-gray-300 text-sm">{t('Как пользоваться панелью: журнал, клиенты, мастера, оплата')}</span>
      </span>
      <span className="text-2xl" style={{ color: '#f472b6' }} aria-hidden="true">→</span>
    </Link>
  )
}

function SalonLink() {
  return (
    <Link
      to="/admin-panel/salon"
      className="flex items-center gap-4 rounded-2xl p-4 mb-8 transition-all active:scale-[0.99]"
      style={{ backgroundColor: '#1f1f1f', border: '1px solid #2e2e2e' }}
    >
      <span className="flex-1 min-w-0">
        <span className="block text-white text-base font-semibold">{t('О салоне')}</span>
        <span className="block text-gray-400 text-sm">{t('Название, адрес, фото, ссылка для записи и QR-код')}</span>
      </span>
      <span className="text-2xl text-gray-500" aria-hidden="true">→</span>
    </Link>
  )
}

export default function SettingsPage() {
  const { isManager } = useStaffAuth()
  return (
    <div className="px-4 md:px-6 py-5 max-w-2xl">
      <PageHeader title={t('Настройки')} subtitle={isManager ? t('Аккаунт и правила записи') : t('Ваш аккаунт')} />
      <AccountSection />
      <HelpButton />
      {isManager && <SalonLink />}
      {isManager && <SalonForm part="rules" />}
    </div>
  )
}
