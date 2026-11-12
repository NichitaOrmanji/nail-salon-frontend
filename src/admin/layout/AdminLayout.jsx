import { useState, useEffect, useCallback } from 'react'
import ImpersonationBar from '../components/ImpersonationBar'
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useStaffAuth } from '../context/StaffAuthContext'
import { fetchPendingCount, fetchStaffMonthLoad } from '../api/appointments'
import { useAutoRefresh } from '../utils/events'
import { useNewVersion } from '../utils/version'
import { ROLE_LABELS } from '../utils/statuses'
import { isValidDateString, todayString } from '../utils/time'
import ErrorBoundary from '../../components/layout/ErrorBoundary'
import LoadCalendar from '../../components/LoadCalendar'
import NewAppointmentsModal from '../components/NewAppointmentsModal'
import OnlineToasts from '../components/OnlineToasts'
import { IconCalendar, IconScissors, IconUsers, IconSettings, IconClose, IconWallet, IconContact, IconPanel, IconStore } from '../components/Icons'
import { t } from '../../i18n'
import { journalNav, JOURNAL_PATH } from './journalNav'

const SIDEBAR_KEY = 'admin_sidebar'
const SALON_PATH = '/admin-panel/salon'

// Разделы панели — вкладками под календарём. Настройки — внизу панели (кто вошёл)
function sections(me, isManager) {
  const salary = me.master_id && me.role !== 'owner'
    ? [{ to: '/admin-panel/salary', label: t('Моя зарплата'), icon: IconWallet }]
    : []
  if (!isManager) {
    return [
      { to: JOURNAL_PATH, label: t('Журнал'), icon: IconCalendar, end: true },
      { to: '/admin-panel/masters', label: t('Мой график'), icon: IconUsers },
      ...salary,
    ]
  }
  return [
    { to: JOURNAL_PATH, label: t('Журнал'), icon: IconCalendar, end: true },
    { to: '/admin-panel/clients', label: t('Клиенты'), icon: IconContact },
    { to: '/admin-panel/masters', label: t('Мастера'), icon: IconUsers },
    { to: '/admin-panel/services', label: t('Услуги'), icon: IconScissors },
    ...(me.role === 'owner' ? [{ to: '/admin-panel/finance', label: t('Финансы'), icon: IconWallet }] : []),
    { to: SALON_PATH, label: t('О салоне'), icon: IconStore },
    ...salary,
  ]
}

// Календарь загруженности: всегда в панели; на журнале показывает и меняет его дату
function SidebarCalendar({ onNavigate }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const onJournal = location.pathname === JOURNAL_PATH
  const dateParam = onJournal ? searchParams.get('date') : null
  const date = isValidDateString(dateParam) ? dateParam : todayString()
  const master = onJournal ? Number(searchParams.get('master')) || null : null

  const [month, setMonth] = useState(() => date.slice(0, 7))
  const [load, setLoad] = useState({})
  // Журнал ушёл на дату другого месяца — календарь листается следом
  const dateMonth = date.slice(0, 7)
  const [prevDateMonth, setPrevDateMonth] = useState(dateMonth)
  if (dateMonth !== prevDateMonth) {
    setPrevDateMonth(dateMonth)
    setMonth(dateMonth)
  }

  const loadMonth = useCallback(() => {
    fetchStaffMonthLoad({ month, master })
      .then(setLoad)
      .catch(() => setLoad({})) // без кружков календарь всё равно листает журнал
  }, [month, master])
  useEffect(() => { loadMonth() }, [loadMonth])
  useAutoRefresh(loadMonth)

  function select(day) {
    onNavigate()
    if (onJournal && journalNav.goToDate) {
      journalNav.goToDate(day, 'day')
    } else {
      navigate(`${JOURNAL_PATH}?view=day&date=${day}`)
    }
  }

  return (
    <div aria-label={t('Календарь загруженности')} role="group">
      <LoadCalendar
        year={Number(month.slice(0, 4))}
        month={Number(month.slice(5, 7)) - 1}
        onMonthChange={(y, m) => setMonth(`${y}-${String(m + 1).padStart(2, '0')}`)}
        days={load}
        selected={onJournal ? date : null}
        onSelect={select}
        compact
      />
    </div>
  )
}

// Содержимое панели: одно и то же для левой колонки и выезжающей панели на телефоне
function SidebarContent({ me, isManager, onNavigate, onHide, hideLabel }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start gap-2 pl-5 pr-2 pt-4 pb-3">
        <div className="flex-1 min-w-0 pt-1">
          {isManager ? (
            <Link to={SALON_PATH} onClick={onNavigate} title={t('О салоне')}
              className="block text-white text-base font-bold truncate hover:text-pink-300">
              {me.company?.name}
            </Link>
          ) : (
            <div className="text-white text-base font-bold truncate">{me.company?.name}</div>
          )}
          {me.role === 'owner' && me.company?.trial_ends_at ? (
            <div className="text-xs mt-0.5" style={{ color: '#fbbf24' }}>
              {t('Пробный период до {date}', { date: new Date(me.company.trial_ends_at).toLocaleDateString(t('ru-RU'), { day: 'numeric', month: 'long' }) })}
            </div>
          ) : (
            <div className="text-gray-500 text-xs">{t('Панель салона')}</div>
          )}
        </div>
        <button
          type="button"
          aria-label={t(hideLabel)}
          title={t(hideLabel)}
          onClick={onHide}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-400 flex-shrink-0 hover:text-white"
        >
          {hideLabel === 'Закрыть меню' ? <IconClose /> : <IconPanel />}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide px-3 pb-3">
        <div className="px-1 pb-4">
          <SidebarCalendar onNavigate={onNavigate} />
        </div>
        <nav aria-label={t('Разделы панели')} className="space-y-1">
          {sections(me, isManager).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className="flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm font-medium"
              style={({ isActive }) => ({ backgroundColor: isActive ? '#242424' : 'transparent', color: isActive ? '#f472b6' : '#d1d5db' })}
            >
              <item.icon />
              {t(item.label)}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Кто вошёл — ссылка в настройки (там Telegram, пароль и выход) */}
      <Link
        to="/admin-panel/settings"
        onClick={onNavigate}
        className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
        style={{ borderTop: '1px solid #2e2e2e' }}
      >
        <span className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0" style={{ backgroundColor: '#2e1f28', color: '#f472b6' }}>
          {(me.name || me.username || '?').trim().charAt(0).toUpperCase()}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-white text-sm font-medium truncate">{me.name || me.username}</span>
          <span className="block text-gray-500 text-xs">{t(ROLE_LABELS[me.role] || me.role)} · {t('Настройки')}</span>
        </span>
        <span className="text-gray-500"><IconSettings size={18} /></span>
      </Link>
    </div>
  )
}

function readSidebar() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) !== 'hidden'
  } catch {
    return true
  }
}

export default function AdminLayout() {
  const { me, isManager } = useStaffAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  // Левая панель на компьютере: скрыта или видна (запоминается в браузере)
  const [sidebarShown, setSidebarShown] = useState(readSidebar)
  const outdated = useNewVersion()
  const [newListOpen, setNewListOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(null)

  const loadPending = useCallback(() => {
    fetchPendingCount().then(setPendingCount).catch(() => {})
  }, [])

  useEffect(() => {
    loadPending()
  }, [loadPending])
  useAutoRefresh(loadPending)

  function toggleSidebar() {
    setSidebarShown(shown => {
      try { localStorage.setItem(SIDEBAR_KEY, shown ? 'hidden' : 'shown') } catch { /* недоступно */ }
      return !shown
    })
  }

  // Выезжающее меню закрывается Escape (раньше карточки записи под ним)
  useEffect(() => {
    if (!menuOpen) return
    const onKey = e => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [menuOpen])

  // Панель прокручивается внутри себя, сама страница — никогда. iPhone при вводе сдвигает страницу,
  // чтобы показать поле над клавиатурой, а после закрытия клавиатуры иногда оставляет её сдвинутой:
  // внизу пустое место и две прокрутки. Когда поле не в фокусе — возвращаем страницу на место
  useEffect(() => {
    const isField = el => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
    const reset = () => {
      if (!isField(document.activeElement) && (window.scrollY || window.scrollX)) window.scrollTo(0, 0)
    }
    const onFocusOut = () => setTimeout(reset, 100)
    window.addEventListener('scroll', reset, { passive: true })
    document.addEventListener('focusout', onFocusOut)
    window.visualViewport?.addEventListener('resize', reset)
    return () => {
      window.removeEventListener('scroll', reset)
      document.removeEventListener('focusout', onFocusOut)
      window.visualViewport?.removeEventListener('resize', reset)
    }
  }, [])

  return (
    <div className="h-dvh flex overflow-hidden" style={{ backgroundColor: '#111111' }}>

      {/* Левая панель (≥ 768px): календарь, журнал, разделы; скрывается кнопкой */}
      {sidebarShown && (
        <aside className="hidden md:block w-72 flex-shrink-0" style={{ backgroundColor: '#1a1a1a', borderRight: '1px solid #2e2e2e' }}>
          <SidebarContent me={me} isManager={isManager} onNavigate={() => {}} onHide={toggleSidebar} hideLabel={t('Скрыть панель')} />
        </aside>
      )}

      {/* Выезжающая панель (< 768px) */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[45] flex">
          <aside role="dialog" aria-label={t('Меню')} className="w-80 max-w-[88vw] h-full" style={{ backgroundColor: '#1a1a1a', borderRight: '1px solid #2e2e2e' }}>
            <SidebarContent me={me} isManager={isManager} onNavigate={() => setMenuOpen(false)} onHide={() => setMenuOpen(false)} hideLabel={t('Закрыть меню')} />
          </aside>
          <div className="flex-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }} onClick={() => setMenuOpen(false)} />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <ImpersonationBar me={me} />
        {outdated && (
          <div className="flex-shrink-0 flex flex-wrap items-center gap-3 px-3 md:px-5 py-2" style={{ backgroundColor: '#3b2a12', borderBottom: '1px solid #f59e0b' }}>
            <span className="flex-1 min-w-0 text-sm" style={{ color: '#fbbf24' }}>{t('Вышла новая версия панели')}</span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[36px] px-4 rounded-xl text-sm font-medium"
              style={{ backgroundColor: '#f59e0b', color: '#111111' }}
            >
              {t('Обновить')}
            </button>
          </div>
        )}
        {me.company?.status === 'pending' && (
          <div className="flex-shrink-0 flex flex-wrap items-center gap-3 px-3 md:px-5 py-2" style={{ backgroundColor: '#2e1f28', borderBottom: '1px solid #db2777' }}>
            <span className="flex-1 min-w-0 text-sm text-gray-200">
              {t('Подтвердите email{email} — до этого клиенты не видят сайт записи.', { email: me.email ? ` (${me.email})` : '' })}
            </span>
            {isManager && (
              <Link to="/admin-panel/settings" className="min-h-[36px] px-4 rounded-xl text-sm font-medium inline-flex items-center" style={{ backgroundColor: '#db2777', color: '#fff' }}>
                {t('Подробнее')}
              </Link>
            )}
          </div>
        )}
        {/* Шапка: кнопка панели, название салона и бейдж новых записей */}
        <header
          className="flex items-center gap-2 px-3 md:px-5 h-14 flex-shrink-0"
          style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2e2e2e' }}
        >
          <button
            type="button"
            aria-label={t('Меню')}
            onClick={() => setMenuOpen(true)}
            className="md:hidden w-11 h-11 -ml-1 rounded-xl flex items-center justify-center text-gray-300 flex-shrink-0"
          >
            <IconPanel />
          </button>
          {!sidebarShown && (
            <button
              type="button"
              aria-label={t('Показать панель')}
              title={t('Показать панель')}
              onClick={toggleSidebar}
              className="hidden md:flex w-11 h-11 -ml-2 rounded-xl items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#db2777', color: '#ffffff' }}
            >
              <IconPanel />
            </button>
          )}
          <div className="flex-1 min-w-0">
            {isManager ? (
              <Link to={SALON_PATH} title={t('О салоне')}
                className="inline-block max-w-full align-middle text-white text-sm md:text-base font-semibold truncate hover:text-pink-300">
                {me.company?.name}
              </Link>
            ) : (
              <div className="text-white text-sm md:text-base font-semibold truncate">{me.company?.name}</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setNewListOpen(true)}
            className="min-h-[44px] px-3 rounded-xl text-sm font-medium flex-shrink-0 flex items-center gap-2"
            style={{
              backgroundColor: pendingCount ? 'rgba(245, 158, 11, 0.15)' : '#242424',
              color: pendingCount ? '#f59e0b' : '#9ca3af',
            }}
          >
            {t('Новые: {count}', { count: pendingCount ?? '…' })}
          </button>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {/* key — после ошибки на странице можно уйти в другой раздел меню */}
          <ErrorBoundary key={location.pathname} homePath="/admin-panel" homeLabel={t('В журнал')}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {newListOpen && <NewAppointmentsModal onClose={() => setNewListOpen(false)} />}
      <OnlineToasts />
    </div>
  )
}
