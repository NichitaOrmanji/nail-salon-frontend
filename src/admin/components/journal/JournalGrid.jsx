import { t } from '../../../i18n'
import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { timeToMin, minToTime, nowMinutes, formatWeekDay } from '../../utils/time'
import { appointmentKind } from '../../utils/statuses'
import { SLOT_MINUTES, SLOT_PX, PX_PER_MIN, MIN_BLOCK_PX, layoutBlocks } from '../../utils/journal'
import { IconMoreVertical } from '../Icons'
import Modal from '../Modal'
import { Button } from '../ui'

const TIME_COL_PX = 56
const COL_MIN_PX = 140
// Ширина одной дорожки, когда записи в колонке пересекаются
const LANE_MIN_PX = 96
// Подколонка мастера в недельном виде «Все мастера»
const MASTER_LANE_MIN_PX = 72
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
  if (!col.master && !col.week) return t('Записи без мастера')
  if (!col.master && !col.work.working) return t('Никто не работает')
  if (col.work.dayOff) return t('Выходной (по дате)')
  if (!col.work.working) return t('Выходной')
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

function MasterAvatar({ master, dim, size = 40 }) {
  const style = { width: size, height: size, opacity: dim ? 0.6 : 1 }
  return master.photo ? (
    <img src={master.photo} alt="" className="rounded-full object-cover flex-shrink-0" style={style} />
  ) : (
    <span
      aria-hidden="true"
      className="rounded-full flex items-center justify-center font-semibold flex-shrink-0"
      style={{ ...style, backgroundColor: '#2e1f28', color: '#f472b6', fontSize: Math.round(size * 0.38) }}
    >
      {(master.name || '?').trim().charAt(0).toUpperCase()}
    </span>
  )
}

// Окно мастера: нажатие на имя в шапке журнала — кто это, часы и записи на день
function MasterInfoModal({ col, colAppointments, canManage, onToggleDayOff, onClose }) {
  const master = col.master
  const work = col.work
  const active = colAppointments
    .filter(a => a.status !== 'cancelled')
    .sort((a, b) => (timeToMin(a.start_time) ?? 0) - (timeToMin(b.start_time) ?? 0))
  const busy = active.reduce((sum, a) => sum + Math.max(0, (timeToMin(a.end_time) ?? 0) - (timeToMin(a.start_time) ?? 0)), 0)
  const breakMin = work.working && work.breakStart != null ? Math.max(0, work.breakEnd - work.breakStart) : 0
  const workMin = work.working ? Math.max(0, work.end - work.start - breakMin) : 0
  const canToggle = canManage && master.is_active !== false

  return (
    <Modal title={t('Мастер')} onClose={onClose} maxWidth="sm:max-w-md">
      <div className="flex flex-col items-center text-center gap-2">
        <MasterAvatar master={master} size={72} />
        <h3 className="text-white text-lg font-semibold">{master.name}</h3>
        {master.is_active === false && <span className="text-xs text-gray-400">{t('Мастер скрыт')}</span>}
        {master.description && <p className="text-gray-400 text-sm whitespace-pre-line">{master.description}</p>}
      </div>

      <dl className="grid grid-cols-2 gap-2 mt-5">
        <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: '#242424' }}>
          <dt className="text-xs text-gray-500">{t('Часы в этот день')}</dt>
          <dd className="text-sm text-white mt-0.5">{columnHours(col)}</dd>
        </div>
        <div className="rounded-xl px-3 py-2.5" style={{ backgroundColor: '#242424' }}>
          <dt className="text-xs text-gray-500">{t('Записей')}</dt>
          <dd className="text-sm text-white mt-0.5">
            {active.length}{workMin > 0 && busy > 0 ? ` · ${t('занято {percent}%', { percent: Math.min(100, Math.round(busy / workMin * 100)) })}` : ''}
          </dd>
        </div>
      </dl>

      {active.length > 0 && (
        <ul className="mt-4 rounded-xl overflow-hidden" style={{ border: '1px solid #2e2e2e' }}>
          {active.map(a => (
            <li key={a.id} className="flex items-center gap-3 px-3 py-2 text-sm" style={{ borderTop: '1px solid #2e2e2e' }}>
              <span className="text-gray-400 tabular-nums flex-shrink-0">{a.start_time}–{a.end_time}</span>
              <span className="text-white min-w-0 truncate">{a.client_name}</span>
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <div className="flex flex-col gap-2 mt-5">
          {canToggle && (
            <Button
              className="w-full"
              onClick={() => {
                onClose()
                onToggleDayOff(col)
              }}
            >
              {work.dayOff ? t('Снять выходной') : t('Сделать выходным в этот день')}
            </Button>
          )}
          <Link to="/admin-panel/masters" className="min-h-[44px] rounded-xl text-sm font-medium inline-flex items-center justify-center text-pink-400">
            {t('Открыть в разделе «Мастера»')}
          </Link>
        </div>
      )}
    </Modal>
  )
}

function ColumnHeader({ col, colAppointments, canManage, onToggleDayOff }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const buttonRef = useRef(null)
  const showMenu = canManage && col.master && col.master.is_active !== false
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const masterDay = !col.week && col.master

  const menu = showMenu && (
    <div className={masterDay ? 'absolute top-0 right-0' : 'flex-shrink-0'}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={t('Меню колонки')}
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
            {col.work.dayOff ? t('Снять выходной') : t('Сделать выходным в этот день')}
          </button>
        </ColumnMenu>
      )}
    </div>
  )

  const hoursLine = (
    <div className="text-xs truncate" style={{ color: col.work.working || !col.master ? '#9ca3af' : '#9098a4' }}>
      {columnHours(col)}
    </div>
  )

  // День: фото сверху, под ним полное имя (нажатие — окно мастера), ниже часы
  if (masterDay) {
    return (
      <div
        className="sticky top-0 z-20 min-w-0"
        style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2e2e2e', borderLeft: '1px solid #2e2e2e' }}
      >
        <button
          type="button"
          onClick={() => setInfoOpen(true)}
          aria-label={t('{name}: о мастере', { name: col.master.name })}
          className="w-full flex flex-col items-center text-center gap-1 px-2 pt-2 pb-1.5 min-w-0 rounded-lg focus:outline-none focus-visible:ring-1 focus-visible:ring-pink-400"
        >
          <MasterAvatar master={col.master} dim={col.hidden} />
          <span
            className="text-sm font-semibold leading-tight line-clamp-2 break-words max-w-full"
            style={{ opacity: col.hidden ? 0.6 : 1, color: '#ffffff' }}
          >
            {col.master.name}
          </span>
          {col.hidden && (
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#2e2e2e', color: '#9ca3af' }}>{t('скрыт')}</span>
          )}
          <span className="max-w-full">{hoursLine}</span>
        </button>
        {menu}
        {/* Окно — поверх всей страницы: шапка колонки закреплена и иначе перекрывает его соседними шапками */}
        {infoOpen && createPortal(
          <MasterInfoModal
            col={col}
            colAppointments={colAppointments}
            canManage={canManage}
            onToggleDayOff={onToggleDayOff}
            onClose={() => setInfoOpen(false)}
          />,
          document.body
        )}
      </div>
    )
  }

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
            {col.week ? formatWeekDay(col.date) : col.master ? col.master.name : t('Без мастера')}
          </span>
          {col.hidden && (
            <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: '#2e2e2e', color: '#9ca3af' }}>{t('скрыт')}</span>
          )}
        </div>
        {hoursLine}
        {col.laneNames?.length > 1 && (
          <div className="flex mt-1 -ml-1">
            {col.laneNames.map((name, i) => (
              <span key={i} className="flex-1 min-w-0 truncate text-[10px] text-gray-500 pl-1" title={name}>{name}</span>
            ))}
          </div>
        )}
      </div>
      {menu}
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
      title={`${a.start_time}–${a.end_time} ${a.blacklist ? t('⛔ чёрный список · ') : ''}${a.client_name}${a.master ? ' · ' + a.master.name : ''}${a.service ? ' · ' + a.service.name : ''} — ${info.label}`}
    >
      {/* Время не переносится по символам, имя и услуга обрезаются многоточием */}
      <div className={`min-w-0 text-[11px] leading-tight text-white ${muted ? 'line-through' : ''}`}>
        {height < COMPACT_BLOCK_PX ? (
          <div className="truncate">
            <span className="font-semibold">{a.start_time}</span> {a.blacklist && <span title={t('Чёрный список')}>⛔</span>}{a.client_name}
          </div>
        ) : (
          <>
            {/* В узкой подколонке — только начало (конец виден по высоте блока) */}
            <div className="font-semibold whitespace-nowrap truncate">{lanes >= 3 ? a.start_time : `${a.start_time}–${a.end_time}`}</div>
            <div className="truncate">{a.blacklist && <span title={t('Чёрный список')}>⛔ </span>}{a.client_name}</div>
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
      if (col.laneIds?.length) {
        // Постоянная подколонка мастера; пересечения внутри мастера делят его подколонку
        const lanes = {}
        col.laneIds.forEach((id, index) => {
          const own = colAppointments.filter(a => (a.master?.id ?? 'none') === id)
          for (const [aid, sub] of Object.entries(layoutBlocks(own))) {
            lanes[aid] = { lane: index * sub.lanes + sub.lane, lanes: col.laneIds.length * sub.lanes, group: index }
          }
        })
        return { col, colAppointments, lanes, minWidth: Math.max(minColumnWidth, col.laneIds.length * MASTER_LANE_MIN_PX) }
      }
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
    // Прокручиваемая сетка: фокус с клавиатуры (Tab) и стрелки для прокрутки, подпись для экранного диктора
    <div ref={scrollRef} tabIndex={0} role="region" aria-label={t('Сетка журнала')}
      className="flex-1 min-h-0 overflow-auto overscroll-contain focus:outline-none focus-visible:ring-1 focus-visible:ring-pink-400"
      style={{ backgroundColor: '#141414' }}>
      <div
        className="grid"
        style={{
          gridTemplateColumns: `${TIME_COL_PX}px ${layout.map(l => `minmax(${l.minWidth}px, 1fr)`).join(' ')}`,
          minWidth: TIME_COL_PX + layout.reduce((sum, l) => sum + l.minWidth, 0),
        }}
      >
        {/* Угол над колонкой времени */}
        <div className="sticky top-0 left-0 z-30" style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2e2e2e' }} />

        {layout.map(({ col, colAppointments }) => (
          <ColumnHeader key={col.key} col={col} colAppointments={colAppointments} canManage={canManage} onToggleDayOff={onToggleDayOff} />
        ))}

        {/* Колонка времени */}
        <div className="sticky left-0 z-10" style={{ height: totalPx, backgroundColor: '#1a1a1a' }}>
          {slots.map((m, i) => (
            <div
              key={m}
              className="absolute right-2 text-[11px] leading-none"
              style={{ top: i === 0 ? 4 : i * SLOT_PX - 5, color: m % 60 === 0 ? '#9ca3af' : '#8b929e' }}
            >
              {minToTime(m)}
            </div>
          ))}
          {nowVisible && (
            <div className="absolute right-0 w-2 h-2 rounded-full" style={{ top: nowTop - 4, backgroundColor: '#db2777' }} />
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
              {/* Обед: клиенты не видят это время на сайте */}
              {work.working && work.breakStart !== null && work.breakStart !== undefined && (
                <div
                  className="absolute inset-x-0 pointer-events-none flex items-start justify-center"
                  style={{
                    ...OFF_STYLE,
                    top: (Math.max(work.breakStart, range.start) - range.start) * PX_PER_MIN,
                    height: Math.max(0, Math.min(work.breakEnd, range.end) - Math.max(work.breakStart, range.start)) * PX_PER_MIN,
                  }}
                >
                  <span className="text-[10px] mt-0.5" style={{ color: '#fbbf24' }}>{t('обед')}</span>
                </div>
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
                <div className="absolute inset-x-0 pointer-events-none" style={{ top: nowTop, height: 2, backgroundColor: '#db2777', zIndex: 7 }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
