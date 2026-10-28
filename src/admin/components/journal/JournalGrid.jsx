import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { timeToMin, minToTime, nowMinutes, formatWeekDay } from '../../utils/time'
import { appointmentKind } from '../../utils/statuses'
import { SLOT_MINUTES, SLOT_PX, PX_PER_MIN, MIN_BLOCK_PX, layoutBlocks } from '../../utils/journal'
import { IconMoreVertical } from '../Icons'

const TIME_COL_PX = 56
const COL_MIN_PX = 140
// Ширина одной дорожки, когда записи в колонке пересекаются
const LANE_MIN_PX = 96
// Блок ниже этого — одна строка «11:15 Имя»
const COMPACT_BLOCK_PX = 30
const MENU_WIDTH_PX = 240
const SCREEN_GUTTER_PX = 16

// Заштрихованная (нерабочая) область колонки
const OFF_STYLE = {
  backgroundColor: 'rgba(0, 0, 0, 0.35)',
  backgroundImage: 'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.035) 0, rgba(255, 255, 255, 0.035) 6px, transparent 6px, transparent 12px)',
}

// Линии сетки: час — заметнее, полчаса — тоньше
const GRID_LINES = {
  backgroundImage: [
    `repeating-linear-gradient(to bottom, #2e2e2e 0, #2e2e2e 1px, transparent 1px, transparent ${SLOT_PX * 2}px)`,
    `repeating-linear-gradient(to bottom, #222222 0, #222222 1px, transparent 1px, transparent ${SLOT_PX}px)`,
  ].join(', '),
}

// Текущее время, обновляется раз в минуту
function useNowMinutes(enabled) {
  const [now, setNow] = useState(nowMinutes)
  useEffect(() => {
    if (!enabled) return
    const timer = setInterval(() => setNow(nowMinutes()), 30000)
    return () => clearInterval(timer)
  }, [enabled])
  return now
}

function columnHours(col) {
  if (!col.master && !col.week) return 'Записи без мастера'
  if (!col.master && !col.work.working) return 'Никто не работает'
  if (col.work.dayOff) return 'Выходной (по дате)'
  if (!col.work.working) return 'Выходной'
  return `${minToTime(col.work.start)}–${minToTime(col.work.end)}`
}

// Меню колонки — поверх всего (через portal), прижато к кнопке, но не выходит за экран
function ColumnMenu({ anchorRef, onClose, children }) {
  const menuRef = useRef(null)

  useLayoutEffect(() => {
    const anchor = anchorRef.current
    const menu = menuRef.current
    if (!anchor || !menu) return
    const place = () => {
      const rect = anchor.getBoundingClientRect()
      const width = Math.min(MENU_WIDTH_PX, window.innerWidth - SCREEN_GUTTER_PX * 2)
      const left = Math.min(Math.max(SCREEN_GUTTER_PX, rect.right - width), window.innerWidth - SCREEN_GUTTER_PX - width)
      menu.style.width = `${width}px`
      menu.style.left = `${Math.max(0, left)}px`
      menu.style.top = `${rect.bottom + 4}px`
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [anchorRef])

  // Escape закрывает только меню (раньше карточки и других обработчиков окна)
  useEffect(() => {
    const onKey = e => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  return createPortal(
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div
        ref={menuRef}
        role="menu"
        className="fixed z-50 rounded-xl overflow-hidden shadow-xl"
        style={{ backgroundColor: '#242424', border: '1px solid #2e2e2e', maxWidth: `calc(100vw - ${SCREEN_GUTTER_PX * 2}px)` }}
      >
        {children}
      </div>
    </>,
    document.body
  )
}

function ColumnHeader({ col, canManage, onToggleDayOff }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const buttonRef = useRef(null)
  const showMenu = canManage && col.master && col.master.is_active !== false
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  return (
    <div
      className="sticky top-0 z-20 flex items-start gap-1 pl-3 pr-0.5 py-1 min-w-0"
      style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2e2e2e', borderLeft: '1px solid #2e2e2e' }}
    >
      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="text-sm font-semibold truncate"
            style={{ opacity: col.hidden ? 0.6 : 1, color: col.week && col.isToday ? '#f472b6' : '#ffffff' }}
          >
            {col.week ? formatWeekDay(col.date) : col.master ? col.master.name : 'Без мастера'}
          </span>
          {col.hidden && (
            <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: '#2e2e2e', color: '#9ca3af' }}>скрыт</span>
          )}
        </div>
        <div className="text-xs truncate" style={{ color: col.work.working || !col.master ? '#9ca3af' : '#6b7280' }}>
          {columnHours(col)}
        </div>
      </div>
      {showMenu && (
        <div className="flex-shrink-0">
          <button
            ref={buttonRef}
            type="button"
            aria-label="Меню колонки"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
            className="w-11 h-11 rounded-lg flex items-center justify-center text-gray-400"
          >
            <IconMoreVertical size={18} />
          </button>
          {menuOpen && (
            <ColumnMenu anchorRef={buttonRef} onClose={closeMenu}>
              <button
                type="button"
                role="menuitem"
                className="w-full text-left px-4 py-2 min-h-[44px] text-sm text-white"
                onClick={() => {
                  setMenuOpen(false)
                  onToggleDayOff(col)
                }}
              >
                {col.work.dayOff ? 'Снять выходной' : 'Сделать выходным в этот день'}
              </button>
            </ColumnMenu>
          )}
        </div>
      )}
    </div>
  )
}

function AppointmentBlock({ appointment: a, range, lane, lanes, selected, showMaster, onClick }) {
  const start = timeToMin(a.start_time) ?? range.start
  const end = Math.max(timeToMin(a.end_time) ?? start, start)
  const top = (start - range.start) * PX_PER_MIN
  const height = Math.max(MIN_BLOCK_PX, (end - start) * PX_PER_MIN)
  const info = appointmentKind(a)
  const muted = a.status === 'cancelled'
  const width = 100 / lanes

  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation()
        onClick(a)
      }}
      className="absolute rounded-lg text-left overflow-hidden px-1.5 py-0.5 flex flex-col justify-start items-stretch"
      style={{
        top: top + 1,
        height: height - 2,
        left: `calc(${lane * width}% + 2px)`,
        width: `calc(${width}% - 4px)`,
        backgroundColor: `${info.color}${muted ? '1f' : '33'}`,
        borderLeft: `3px solid ${info.color}`,
        outline: selected ? '2px solid #f472b6' : 'none',
        opacity: muted ? 0.6 : 1,
        zIndex: selected ? 6 : 5,
      }}
      title={`${a.start_time}–${a.end_time} ${a.client_name}${a.master ? ' · ' + a.master.name : ''}${a.service ? ' · ' + a.service.name : ''} — ${info.label}`}
    >
      {/* Время не переносится по символам, имя и услуга обрезаются многоточием */}
      <div className={`min-w-0 text-[11px] leading-tight text-white ${muted ? 'line-through' : ''}`}>
        {height < COMPACT_BLOCK_PX ? (
          <div className="truncate">
            <span className="font-semibold">{a.start_time}</span> {a.client_name}
          </div>
        ) : (
          <>
            <div className="font-semibold whitespace-nowrap truncate">{a.start_time}–{a.end_time}</div>
            <div className="truncate">{a.client_name}</div>
            {showMaster && a.master && height >= 44 && <div className="truncate text-gray-300">{a.master.name}</div>}
            {a.service && height >= (showMaster ? 68 : 56) && <div className="truncate text-gray-300">{a.service.name}</div>}
          </>
        )}
      </div>
    </button>
  )
}

// Сетка журнала: колонки (мастера дня или дни недели) × строки по 30 минут.
// Прокручивается только она сама; шапка и колонка времени закреплены.
export default function JournalGrid({ columns, appointments, range, dataKey, selectedId, canManage, showMaster, scrollToNow = true, minColumnWidth = COL_MIN_PX, onSelect, onEmptyClick, onToggleDayOff }) {
  const scrollRef = useRef(null)
  const scrolledFor = useRef(null)
  const isToday = columns.some(col => col.isToday)
  const now = useNowMinutes(isToday)
  const totalPx = (range.end - range.start) * PX_PER_MIN
  const slots = []
  for (let m = range.start; m < range.end; m += SLOT_MINUTES) slots.push(m)

  // При открытии: день «сегодня» — к текущему времени, иначе (и неделя) — к началу дня
  useEffect(() => {
    const el = scrollRef.current
    if (!el || scrolledFor.current === dataKey) return
    scrolledFor.current = dataKey
    if (isToday && scrollToNow) {
      const current = nowMinutes()
      el.scrollTop = Math.max(0, (current - range.start) * PX_PER_MIN - el.clientHeight / 3)
    } else {
      el.scrollTop = 0
    }
  }, [dataKey, isToday, scrollToNow, range.start])

  // Раскладка пересекающихся записей; колонка шире, если дорожек много
  const layout = useMemo(() => {
    return columns.map(col => {
      const colAppointments = appointments.filter(col.match)
      const lanes = layoutBlocks(colAppointments)
      const maxLanes = Math.max(1, ...Object.values(lanes).map(l => l.lanes))
      return { col, colAppointments, lanes, minWidth: Math.max(minColumnWidth, maxLanes * LANE_MIN_PX) }
    })
  }, [columns, appointments, minColumnWidth])

  const nowVisible = isToday && now >= range.start && now <= range.end
  const nowTop = (now - range.start) * PX_PER_MIN

  function handleColumnClick(e, col) {
    const rect = e.currentTarget.getBoundingClientRect()
    const minutes = range.start + (e.clientY - rect.top) / PX_PER_MIN
    const rounded = Math.min(range.end - 15, Math.max(range.start, Math.floor(minutes / 15) * 15))
    onEmptyClick(col, minToTime(rounded))
  }

  return (
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-auto overscroll-contain" style={{ backgroundColor: '#141414' }}>
      <div
        className="grid"
        style={{
          gridTemplateColumns: `${TIME_COL_PX}px ${layout.map(l => `minmax(${l.minWidth}px, 1fr)`).join(' ')}`,
          minWidth: TIME_COL_PX + layout.reduce((sum, l) => sum + l.minWidth, 0),
        }}
      >
        {/* Угол над колонкой времени */}
        <div className="sticky top-0 left-0 z-30" style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2e2e2e' }} />

        {columns.map(col => (
          <ColumnHeader key={col.key} col={col} canManage={canManage} onToggleDayOff={onToggleDayOff} />
        ))}

        {/* Колонка времени */}
        <div className="sticky left-0 z-10" style={{ height: totalPx, backgroundColor: '#1a1a1a' }}>
          {slots.map((m, i) => (
            <div
              key={m}
              className="absolute right-2 text-[11px] leading-none"
              style={{ top: i === 0 ? 4 : i * SLOT_PX - 5, color: m % 60 === 0 ? '#9ca3af' : '#4b5563' }}
            >
              {minToTime(m)}
            </div>
          ))}
          {nowVisible && (
            <div className="absolute right-0 w-2 h-2 rounded-full" style={{ top: nowTop - 4, backgroundColor: '#f472b6' }} />
          )}
        </div>

        {/* Колонки мастеров */}
        {layout.map(({ col, colAppointments, lanes }) => {
          const work = col.work
          return (
            <div
              key={col.key}
              className="relative cursor-pointer"
              style={{ height: totalPx, borderLeft: '1px solid #2e2e2e', ...GRID_LINES }}
              onClick={e => handleColumnClick(e, col)}
            >
              {/* Нерабочие часы */}
              {!work.neutral && !work.working && <div className="absolute inset-0 pointer-events-none" style={OFF_STYLE} />}
              {work.working && work.start > range.start && (
                <div className="absolute inset-x-0 top-0 pointer-events-none" style={{ ...OFF_STYLE, height: (work.start - range.start) * PX_PER_MIN }} />
              )}
              {work.working && work.end < range.end && (
                <div className="absolute inset-x-0 bottom-0 pointer-events-none" style={{ ...OFF_STYLE, height: (range.end - work.end) * PX_PER_MIN }} />
              )}

              {colAppointments.map(a => (
                <AppointmentBlock
                  key={a.id}
                  appointment={a}
                  range={range}
                  lane={lanes[a.id]?.lane ?? 0}
                  lanes={lanes[a.id]?.lanes ?? 1}
                  selected={a.id === selectedId}
                  showMaster={showMaster}
                  onClick={onSelect}
                />
              ))}

              {nowVisible && col.isToday && (
                <div className="absolute inset-x-0 pointer-events-none" style={{ top: nowTop, height: 2, backgroundColor: '#f472b6', zIndex: 7 }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
