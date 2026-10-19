import { useState, useEffect, useCallback } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useStaffAuth } from '../context/StaffAuthContext'
import { fetchPendingCount } from '../api/appointments'
import { useAutoRefresh } from '../utils/events'
import { ROLE_LABELS } from '../utils/statuses'
import ErrorBoundary from '../../components/layout/ErrorBoundary'
import ChangePasswordModal from '../components/ChangePasswordModal'
import NewAppointmentsModal from '../components/NewAppointmentsModal'
import { IconCalendar, IconScissors, IconUsers, IconSettings, IconMenu, IconClose } from '../components/Icons'

function menuItems(isManager) {
  if (!isManager) {
    return [
      { to: '/admin-panel', label: 'Журнал', icon: IconCalendar, end: true },
      { to: '/admin-panel/masters', label: 'Мой график', icon: IconUsers },
    ]
  }
  return [
    { to: '/admin-panel', label: 'Журнал', icon: IconCalendar, end: true },
    { to: '/admin-panel/services', label: 'Услуги', icon: IconScissors },
    { to: '/admin-panel/masters', label: 'Мастера', icon: IconUsers },
    { to: '/admin-panel/settings', label: 'Настройки', icon: IconSettings },
  ]
}

// Содержимое меню: одно и то же для левой колонки и выезжающей панели
function SidebarContent({ me, isManager, onNavigate, onChangePassword, onLogout }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-5 pb-4">
        <div className="text-white text-base font-bold truncate">{me.company?.name}</div>
        <div className="text-gray-500 text-xs">Панель салона</div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {menuItems(isManager).map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className="flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm font-medium transition-all"
            style={({ isActive }) => ({
              backgroundColor: isActive ? '#242424' : 'transparent',
              color: isActive ? '#f472b6' : '#d1d5db',
            })}
          >
            <item.icon />
            {item.label}
          </NavLink>
        ))}
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 px-3 min-h-[44px] rounded-xl text-sm text-gray-400"
        >
          Сайт записи ↗
        </a>
      </nav>

      <div className="px-3 py-4 space-y-1" style={{ borderTop: '1px solid #2e2e2e' }}>
        <div className="px-3 pb-2">
          <div className="text-white text-sm font-medium truncate">{me.name || me.username}</div>
          <div className="text-gray-500 text-xs">{ROLE_LABELS[me.role] || me.role}</div>
        </div>
        <button
          type="button"
          onClick={onChangePassword}
          className="w-full text-left px-3 min-h-[44px] rounded-xl text-sm text-gray-300"
        >
          Сменить пароль
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="w-full text-left px-3 min-h-[44px] rounded-xl text-sm"
          style={{ color: '#f87171' }}
        >
          Выйти
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const { me, isManager, logout } = useStaffAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [newListOpen, setNewListOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(null)

  const loadPending = useCallback(() => {
    fetchPendingCount().then(setPendingCount).catch(() => {})
  }, [])

  useEffect(() => {
    loadPending()
  }, [loadPending])
  useAutoRefresh(loadPending)

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

  const sidebarProps = {
    me,
    isManager,
    onNavigate: () => setMenuOpen(false),
    onChangePassword: () => { setMenuOpen(false); setPasswordOpen(true) },
    onLogout: logout,
  }

  return (
    <div className="h-dvh flex overflow-hidden" style={{ backgroundColor: '#111111' }}>

      {/* Левое меню (≥ 768px) */}
      <aside className="hidden md:block w-56 flex-shrink-0" style={{ backgroundColor: '#1a1a1a', borderRight: '1px solid #2e2e2e' }}>
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Выезжающее меню (< 768px) */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[45] flex">
          <aside role="dialog" aria-label="Меню" className="w-72 max-w-[85vw] h-full relative" style={{ backgroundColor: '#1a1a1a', borderRight: '1px solid #2e2e2e' }}>
            <button
              type="button"
              aria-label="Закрыть меню"
              onClick={() => setMenuOpen(false)}
              className="absolute top-3 right-2 w-11 h-11 rounded-xl flex items-center justify-center text-gray-400"
            >
              <IconClose />
            </button>
            <SidebarContent {...sidebarProps} />
          </aside>
          <div className="flex-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }} onClick={() => setMenuOpen(false)} />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Шапка: название салона и бейдж новых записей */}
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
            <IconMenu />
          </button>
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

      {passwordOpen && <ChangePasswordModal onClose={() => setPasswordOpen(false)} />}
      {newListOpen && <NewAppointmentsModal onClose={() => setNewListOpen(false)} />}
    </div>
  )
}
