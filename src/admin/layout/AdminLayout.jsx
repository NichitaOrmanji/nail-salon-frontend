import { useState, useEffect, useCallback, useRef } from 'react'
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
import {
  IconCalendar, IconScissors, IconUsers, IconSettings, IconClose, IconWallet, IconContact, IconAlert, IconStart,
  IconPanel, IconChevronDown, IconHelp, IconExternal,
} from '../components/Icons'
import { journalNav, JOURNAL_PATH } from './journalNav'

const SIDEBAR_KEY = 'admin_sidebar'

// Разделы во всплывающем списке (журнал — отдельной кнопкой, он открыт почти всегда)
function sections(me, isManager) {
  const salary = me.master_id && me.role !== 'owner'
    ? [{ to: '/admin-panel/salary', label: 'Моя зарплата', icon: IconWallet }]
    : []
  if (!isManager) {
    return [
      { to: '/admin-panel/masters', label: 'Мой график', icon: IconUsers },
      ...salary,
      { to: '/admin-panel/settings', label: 'Настройки', icon: IconSettings },
      { to: '/admin-panel/help', label: 'Помощь', icon: IconHelp },
    ]
  }
  return [
    { to: '/admin-panel/clients', label: 'Клиенты', icon: IconContact },
    { to: '/admin-panel/debtors', label: 'Должники', icon: IconAlert },
    { to: '/admin-panel/services', label: 'Услуги', icon: IconScissors },
    { to: '/admin-panel/masters', label: 'Мастера', icon: IconUsers },
    ...(me.role === 'owner' ? [{ to: '/admin-panel/finance', label: 'Финансы', icon: IconWallet }] : []),
    ...salary,
    { to: '/admin-panel/salon', label: 'О салоне', icon: IconStart },
    { to: '/admin-panel/settings', label: 'Настройки', icon: IconSettings },
    { to: '/admin-panel/help', label: 'Помощь', icon: IconHelp },
  ]
}

// Всплывающий список разделов: закрывается выбором, кликом мимо и Escape.
// На компьютере — окно справа от панели (не обрезается её краем), на телефоне — список под кнопкой.
function SectionsMenu({ items, onNavigate, siteUrl, inline }) {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const rootRef = useRef(null)
  const buttonRef = useRef(null)
  const current = items.find(item => location.pathname.startsWith(item.to))

  function toggle() {
    if (!open && !inline && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const height = (items.length + 1) * 40 + 12
      setPos({ left: rect.right + 8, top: Math.max(8, Math.min(rect.top, window.innerHeight - height - 8)) })
    }
    setOpen(o => !o)
  }

  useEffect(() => {
    if (!open) return
    const onDown = e => { if (!rootRef.current?.contains(e.target)) setOpen(false) }
    const onKey = e => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className="w-full flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm font-medium"
        style={{ backgroundColor: current ? '#242424' : 'transparent', color: current ? '#f472b6' : '#d1d5db' }}
      >
        {current ? <current.icon /> : <IconMenuGrid />}
        <span className="flex-1 text-left truncate">{current ? current.label : 'Разделы'}</span>
        <span className="text-gray-500" style={{ transform: open ? (inline ? 'rotate(180deg)' : 'rotate(-90deg)') : 'none' }}><IconChevronDown size={16} /></span>
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Разделы"
          className={inline ? 'mt-1 rounded-xl py-1' : 'fixed z-50 w-56 rounded-xl py-1 shadow-2xl'}
          style={{ backgroundColor: '#242424', border: '1px solid #333333', ...(inline ? {} : pos) }}
        >
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              role="menuitem"
              onClick={() => { setOpen(false); onNavigate() }}
              className="flex items-center gap-3 px-3 min-h-[40px] text-sm"
              style={({ isActive }) => ({ color: isActive ? '#f472b6' : '#d1d5db' })}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
          <a
            href={siteUrl}
            target="_blank"
            rel="noreferrer"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 min-h-[40px] text-sm text-gray-400"
            style={{ borderTop: '1px solid #333333' }}
          >
            <IconExternal size={18} />
            Сайт записи
          </a>
        </div>
      )}
    </div>
  )
}

function IconMenuGrid() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
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
      journalNav.goToDate(day)
    } else {
      navigate(`${JOURNAL_PATH}?date=${day}`)
    }
  }

  return (
    <div aria-label="Календарь загруженности" role="group">
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
function SidebarContent({ me, isManager, onNavigate, onHide, hideLabel, inlineMenu = false }) {
  const siteUrl = me.company?.slug ? `/?salon=${me.company.slug}` : '/'
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start gap-2 pl-5 pr-2 pt-4 pb-3">
        <div className="flex-1 min-w-0 pt-1">
          <div className="text-white text-base font-bold truncate">{me.company?.name}</div>
          {me.role === 'owner' && me.company?.trial_ends_at ? (
            <div className="text-xs mt-0.5" style={{ color: '#fbbf24' }}>
              Пробный период до {new Date(me.company.trial_ends_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
            </div>
          ) : (
            <div className="text-gray-500 text-xs">Панель салона</div>
          )}
        </div>
        <button
          type="button"
          aria-label={hideLabel}
          title={hideLabel}
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
        <nav aria-label="Навигация панели" className="space-y-1">
          <NavLink
            to={JOURNAL_PATH}
            end
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm font-medium"
            style={({ isActive }) => ({ backgroundColor: isActive ? '#242424' : 'transparent', color: isActive ? '#f472b6' : '#d1d5db' })}
          >
            <IconCalendar />
            Журнал
          </NavLink>
          <SectionsMenu items={sections(me, isManager)} onNavigate={onNavigate} siteUrl={siteUrl} inline={inlineMenu} />
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
          <span className="block text-gray-500 text-xs">{ROLE_LABELS[me.role] || me.role}</span>
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

  return (
    <div className="h-dvh flex overflow-hidden" style={{ backgroundColor: '#111111' }}>

      {/* Левая панель (≥ 768px): календарь, журнал, разделы; скрывается кнопкой */}
      {sidebarShown && (
        <aside className="hidden md:block w-72 flex-shrink-0" style={{ backgroundColor: '#1a1a1a', borderRight: '1px solid #2e2e2e' }}>
          <SidebarContent me={me} isManager={isManager} onNavigate={() => {}} onHide={toggleSidebar} hideLabel="Скрыть панель" />
        </aside>
      )}

      {/* Выезжающая панель (< 768px) */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[45] flex">
          <aside role="dialog" aria-label="Меню" className="w-80 max-w-[88vw] h-full" style={{ backgroundColor: '#1a1a1a', borderRight: '1px solid #2e2e2e' }}>
            <SidebarContent me={me} isManager={isManager} onNavigate={() => setMenuOpen(false)} onHide={() => setMenuOpen(false)} hideLabel="Закрыть меню" inlineMenu />
          </aside>
          <div className="flex-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }} onClick={() => setMenuOpen(false)} />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {outdated && (
          <div className="flex-shrink-0 flex flex-wrap items-center gap-3 px-3 md:px-5 py-2" style={{ backgroundColor: '#3b2a12', borderBottom: '1px solid #f59e0b' }}>
            <span className="flex-1 min-w-0 text-sm" style={{ color: '#fbbf24' }}>Вышла новая версия панели</span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="min-h-[36px] px-4 rounded-xl text-sm font-medium"
              style={{ backgroundColor: '#f59e0b', color: '#111111' }}
            >
              Обновить
            </button>
          </div>
        )}
        {me.company?.status === 'pending' && (
          <div className="flex-shrink-0 flex flex-wrap items-center gap-3 px-3 md:px-5 py-2" style={{ backgroundColor: '#2e1f28', borderBottom: '1px solid #db2777' }}>
            <span className="flex-1 min-w-0 text-sm text-gray-200">
              Подтвердите email{me.email ? ` (${me.email})` : ''} — до этого клиенты не видят сайт записи.
            </span>
            {isManager && (
              <Link to="/admin-panel/salon" className="min-h-[36px] px-4 rounded-xl text-sm font-medium inline-flex items-center" style={{ backgroundColor: '#db2777', color: '#fff' }}>
                Подробнее
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
            aria-label="Меню"
            onClick={() => setMenuOpen(true)}
            className="md:hidden w-11 h-11 -ml-1 rounded-xl flex items-center justify-center text-gray-300 flex-shrink-0"
          >
            <IconPanel />
          </button>
          {!sidebarShown && (
            <button
              type="button"
              aria-label="Показать панель"
              title="Показать панель"
              onClick={toggleSidebar}
              className="hidden md:flex w-11 h-11 -ml-2 rounded-xl items-center justify-center text-gray-300 flex-shrink-0 hover:text-white"
            >
              <IconPanel />
            </button>
          )}
          <div className="flex-1 min-w-0 text-white text-sm md:text-base font-semibold truncate">{me.company?.name}</div>
          <button
            type="button"
            onClick={() => setNewListOpen(true)}
            className="min-h-[44px] px-3 rounded-xl text-sm font-medium flex-shrink-0 flex items-center gap-2"
            style={{
              backgroundColor: pendingCount ? 'rgba(245, 158, 11, 0.15)' : '#242424',
              color: pendingCount ? '#f59e0b' : '#9ca3af',
            }}
          >
            Новые: {pendingCount ?? '…'}
          </button>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {/* key — после ошибки на странице можно уйти в другой раздел меню */}
          <ErrorBoundary key={location.pathname} homePath="/admin-panel" homeLabel="В журнал">
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {newListOpen && <NewAppointmentsModal onClose={() => setNewListOpen(false)} />}
      <OnlineToasts />
    </div>
  )
}
