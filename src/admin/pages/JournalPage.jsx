import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom'
import { useStaffAuth } from '../context/StaffAuthContext'
import { fetchAppointments } from '../api/appointments'
import { fetchStaffMasters, fetchDaysOff, addDayOff, removeDayOff } from '../api/masters'
import { notifyDataChanged, useAutoRefresh } from '../utils/events'
import { todayString, addDays, formatDayTitle, isValidDateString, parseDate } from '../utils/time'
import { ACTIVE_STATUSES, KINDS } from '../utils/statuses'
import { buildColumns, buildRange, buildWeekColumns, weekStart, DISCARD_CONFIRM } from '../utils/journal'
import JournalGrid from '../components/journal/JournalGrid'
import AppointmentCard from '../components/journal/AppointmentCard'
import AppointmentFormModal from '../components/journal/AppointmentFormModal'
import { Button, Checkbox, ErrorText, Select } from '../components/ui'
import { IconChevronLeft, IconChevronRight } from '../components/Icons'
import Spinner from '../../components/layout/Spinner'

const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

// '2026-10-26' → '26 окт – 1 ноя'
function weekTitle(start) {
  const a = parseDate(start)
  const b = parseDate(addDays(start, 6))
  return `${a.getDate()} ${MONTHS_SHORT[a.getMonth()]} – ${b.getDate()} ${MONTHS_SHORT[b.getMonth()]}`
}

// Журнал записей: неделя (по умолчанию) или день.
// Вид, дата, мастер и открытая карточка — в адресе: ?view=week&date=2026-10-20&master=3&open=15.
// Открытие карточки и формы добавляет запись в историю (state.journalOverlay),
// поэтому кнопка «Назад» на телефоне закрывает их, а не уводит из панели.
export default function JournalPage() {
  const { me, isManager } = useStaffAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const historyState = location.state && typeof location.state === 'object' ? location.state : null
  const dateParam = searchParams.get('date')
  const dateInUrl = isValidDateString(dateParam)
  const date = dateInUrl ? dateParam : todayString()
  const openId = Number(searchParams.get('open')) || null
  const view = searchParams.get('view') === 'day' ? 'day' : 'week'
  const masterFilter = Number(searchParams.get('master')) || null
  // Неделя всегда с понедельника; день — сама дата
  const rangeFrom = view === 'week' ? weekStart(date) : date
  const rangeTo = view === 'week' ? addDays(rangeFrom, 6) : date
  const dataKey = `${view}:${rangeFrom}`

  // Дата без ?date= фиксируется в адресе один раз: в полночь день под открытой
  // формой или карточкой не меняется
  useEffect(() => {
    if (dateInUrl) return
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('date', date)
      return next
    }, { replace: true, state: historyState })
  }, [dateInUrl, date, setSearchParams, historyState])

  const [data, setData] = useState(null) // { key, appointments, masters, daysOff }
  const [loadError, setLoadError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [showCancelled, setShowCancelled] = useState(false)
  // { id, appointment } — редактирование, { id, initial } — создание
  const [form, setForm] = useState(null)
  const requestRef = useRef(0)
  const formIdRef = useRef(0)
  // После сохранения формы, открытой поверх карточки: вернуться на запись карточки и заменить её
  const pendingParamsRef = useRef(null)
  const toolbarRef = useRef(null)
  // Несохранённая заметка в открытой карточке; cardResetKey — сбросить её после «Закрыть без сохранения»
  const cardDirtyRef = useRef(false)
  const [cardResetKey, setCardResetKey] = useState(0)
  const handleCardDirty = useCallback(dirty => {
    cardDirtyRef.current = dirty
  }, [])

  const load = useCallback(() => {
    const requestId = ++requestRef.current
    return Promise.all([
      fetchAppointments({ dateFrom: rangeFrom, dateTo: rangeTo }),
      fetchStaffMasters(),
      fetchDaysOff({ dateFrom: rangeFrom, dateTo: rangeTo }),
    ])
      .then(([appointments, masters, daysOff]) => {
        if (requestId !== requestRef.current) return
        setData({ key: dataKey, appointments, masters, daysOff })
        setLoadError(null)
      })
      .catch(err => {
        if (requestId !== requestRef.current) return
        setLoadError(err.message)
      })
  }, [rangeFrom, rangeTo, dataKey])

  useEffect(() => {
    load()
  }, [load])
  useAutoRefresh(load)

  const current = data && data.key === dataKey ? data : null

  // Дата всегда в адресе; по умолчанию запись истории заменяется
  function setParams(next, { push = false, state = historyState } = {}) {
    const params = { date: next.date ?? date }
    const nextView = next.view ?? view
    if (nextView === 'day') params.view = 'day'
    const nextMaster = 'master' in next ? next.master : masterFilter
    if (nextMaster) params.master = String(nextMaster)
    const nextOpen = 'open' in next ? next.open : openId
    if (nextOpen) params.open = String(nextOpen)
    setSearchParams(params, { replace: !push, state })
  }

  // Уйти от карточки с несохранённой заметкой — только после подтверждения
  function confirmLeaveCard() {
    if (!openId || !cardDirtyRef.current) return true
    if (!window.confirm(DISCARD_CONFIRM)) return false
    cardDirtyRef.current = false
    setCardResetKey(k => k + 1)
    return true
  }

  function openCard(id) {
    if (id === openId) return
    if (!confirmLeaveCard()) return
    if (openId || historyState?.journalOverlay) {
      // Карточка уже открыта — меняем её на месте, без новой записи истории
      setParams({ open: id })
    } else {
      setParams({ open: id }, { push: true, state: { journalOverlay: true } })
    }
  }

  function closeCard() {
    if (historyState?.journalOverlay && !historyState.journalForm) {
      navigate(-1)
    } else {
      setParams({ open: null }, { state: null })
    }
  }

  function goToDate(value) {
    if (!isValidDateString(value)) return
    if (!confirmLeaveCard()) return
    setActionError(null)
    setParams({ date: value, open: null }, { state: null })
  }

  function changeView(next) {
    if (next === view || !confirmLeaveCard()) return
    setParams({ view: next, open: null }, { state: null })
  }

  function changeMaster(id) {
    setParams({ master: id || null, open: null }, { state: null })
  }

  const step = view === 'week' ? 7 : 1

  useEffect(() => {
    const pending = pendingParamsRef.current
    if (!pending || historyState?.journalForm) return
    pendingParamsRef.current = null
    setSearchParams({ date: pending.date, open: String(pending.open) }, { replace: true, state: { journalOverlay: true } })
  }, [location.key, historyState, setSearchParams])

  // Форма — тоже отдельная запись истории: «Назад» её закрывает
  function openForm(spec) {
    const id = ++formIdRef.current
    // Под формой — запись истории открытой карточки
    const overCard = !!openId && !!historyState?.journalOverlay
    setForm({ ...spec, id, overCard })
    setParams({}, { push: true, state: { journalOverlay: true, journalForm: id } })
  }

  const formVisible = !!form && historyState?.journalForm === form.id

  function closeForm() {
    if (formVisible) navigate(-1)
    setForm(null)
  }

  const visibleAppointments = useMemo(() => {
    if (!current) return []
    return current.appointments.filter(a => showCancelled || a.status !== 'cancelled')
  }, [current, showCancelled])

  const dayOffMasterIds = useMemo(() => {
    return new Set((current?.daysOff || []).filter(d => d.date === date).map(d => d.master))
  }, [current, date])

  const filterMaster = current && masterFilter ? current.masters.find(m => m.id === masterFilter) || null : null

  const columns = useMemo(() => {
    if (!current) return []
    if (view === 'week') {
      return buildWeekColumns({ masters: current.masters, date, master: filterMaster, dayOffs: current.daysOff || [] })
    }
    return buildColumns({ masters: current.masters, appointments: visibleAppointments, date, dayOffMasterIds })
  }, [current, view, filterMaster, visibleAppointments, date, dayOffMasterIds])

  // В неделе с фильтром — только записи этого мастера (диапазон часов по ним)
  const gridAppointments = useMemo(() => {
    if (view !== 'week' || !filterMaster) return visibleAppointments
    return visibleAppointments.filter(a => a.master?.id === filterMaster.id)
  }, [view, filterMaster, visibleAppointments])

  const range = useMemo(() => buildRange(columns, gridAppointments), [columns, gridAppointments])

  // Карточка держится по id — опрос журнала её не сбрасывает
  const selected = current && openId ? current.appointments.find(a => a.id === openId) || null : null

  function openCreate(col, time) {
    if (!confirmLeaveCard()) return
    const master = col ? col.master : filterMaster
    const masterId = master && master.is_active !== false ? master.id : null
    openForm({ initial: { masterId, date: col?.date || date, time } })
  }

  async function toggleDayOff(col) {
    const m = col.master
    const day = col.date
    setActionError(null)
    try {
      if (col.work.dayOff) {
        await removeDayOff(m.id, day)
      } else {
        const count = current.appointments.filter(a => a.master?.id === m.id && a.date === day && ACTIVE_STATUSES.includes(a.status)).length
        if (count > 0 && !window.confirm(`У мастера ${m.name} ${count} записей в этот день. Записи не отменятся сами. Всё равно сделать выходным?`)) return
        await addDayOff(m.id, day)
      }
      notifyDataChanged()
    } catch (err) {
      setActionError(err.message)
    }
  }

  function handleSaved(saved) {
    if (saved?.id && saved.date) {
      if (formVisible && form.overCard) {
        // Убираем запись формы и заменяем запись карточки — без лишнего шага «Назад»
        pendingParamsRef.current = { date: saved.date, open: saved.id }
        navigate(-1)
        setForm(null)
      } else {
        setForm(null)
        // Запись истории формы становится записью карточки
        setParams({ date: saved.date, open: saved.id }, { state: { journalOverlay: true } })
      }
    } else {
      closeForm()
    }
  }

  const isToday = view === 'week' ? rangeFrom === weekStart(todayString()) : date === todayString()

  return (
    <div className="h-full flex flex-col">

      {/* Панель дня */}
      <div ref={toolbarRef} className="flex-shrink-0 px-3 md:px-5 py-3 flex flex-wrap items-center gap-2" style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2e2e2e' }}>
        <div className="flex items-center gap-1">
          <Button aria-label={view === 'week' ? 'Предыдущая неделя' : 'Предыдущий день'} className="w-11 px-0" onClick={() => goToDate(addDays(date, -step))}>
            <IconChevronLeft />
          </Button>
          <Button onClick={() => goToDate(todayString())} style={isToday ? { color: '#f472b6' } : undefined}>Сегодня</Button>
          <Button aria-label={view === 'week' ? 'Следующая неделя' : 'Следующий день'} className="w-11 px-0" onClick={() => goToDate(addDays(date, step))}>
            <IconChevronRight />
          </Button>
        </div>
        <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #2e2e2e' }} role="group" aria-label="Вид журнала">
          {[['week', 'Неделя'], ['day', 'День']].map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              onClick={() => changeView(key)}
              className="min-h-[44px] px-3 text-sm font-medium"
              style={{ backgroundColor: view === key ? '#f472b6' : '#242424', color: view === key ? '#ffffff' : '#9ca3af' }}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="date"
          aria-label="Дата"
          value={date}
          onChange={e => goToDate(e.target.value)}
          className="min-h-[44px] px-3 rounded-xl text-white text-sm outline-none"
          style={{ backgroundColor: '#242424', border: '1px solid #2e2e2e', colorScheme: 'dark' }}
        />
        {view === 'week' && isManager && current && (
          <div className="w-44">
            <Select aria-label="Мастер" value={masterFilter || ''} onChange={e => changeMaster(Number(e.target.value) || null)}>
              <option value="">Все мастера</option>
              {current.masters.filter(m => m.is_active || m.id === masterFilter).map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </Select>
          </div>
        )}
        <div className="basis-full lg:basis-auto lg:flex-1 min-w-0 text-white text-lg font-semibold truncate lg:pl-2">
          {view === 'week' ? weekTitle(rangeFrom) : formatDayTitle(date)}
        </div>
        <Checkbox checked={showCancelled} onChange={setShowCancelled} label="Показывать отменённые" className="mr-auto lg:mr-0" />
        <Button variant="primary" onClick={() => openCreate(null, '')}>+ Запись</Button>
      </div>

      {(loadError || actionError) && (
        <div className="flex-shrink-0 px-4 py-2 flex flex-wrap items-center gap-3" style={{ backgroundColor: 'rgba(248, 113, 113, 0.08)' }}>
          <ErrorText className="flex-1 min-w-0">{actionError || loadError}</ErrorText>
          {loadError && <Button onClick={load}>Повторить</Button>}
        </div>
      )}

      {/* Легенда цветов */}
      <div className="flex-shrink-0 px-3 md:px-5 py-2 flex flex-wrap gap-x-4 gap-y-1" style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2e2e2e' }}>
        {Object.entries(KINDS).filter(([key]) => key !== 'cancelled' || showCancelled).map(([key, kind]) => (
          <span key={key} className="inline-flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: kind.color }} />
            {kind.label}
          </span>
        ))}
      </div>

      {!current && !loadError && <Spinner />}

      {current && columns.length === 0 && (
        <div className="flex-1 flex items-center justify-center px-6 text-center">
          <p className="text-gray-500 text-sm">
            {isManager ? 'Нет активных мастеров. Добавьте мастера в разделе «Мастера».' : 'Нет данных для журнала.'}
          </p>
        </div>
      )}

      {current && columns.length > 0 && (
        <JournalGrid
          columns={columns}
          appointments={gridAppointments}
          range={range}
          dataKey={dataKey}
          showMaster={view === 'week' && !filterMaster}
          scrollToNow={view === 'day'}
          minColumnWidth={view === 'week' ? 120 : undefined}
          selectedId={openId}
          canManage={isManager}
          onSelect={a => openCard(a.id)}
          onEmptyClick={openCreate}
          onToggleDayOff={toggleDayOff}
        />
      )}

      {/* Под открытой формой карточка не размонтируется — несохранённая заметка остаётся */}
      {selected && (
        <AppointmentCard
          key={`${selected.id}-${cardResetKey}`}
          appointment={selected}
          isManager={isManager}
          hidden={formVisible}
          topAnchorRef={toolbarRef}
          onDirtyChange={handleCardDirty}
          onClose={closeCard}
          onEdit={a => openForm({ appointment: a })}
        />
      )}

      {formVisible && current && (
        <AppointmentFormModal
          key={form.id}
          appointment={form.appointment}
          initial={form.initial}
          masters={current.masters}
          me={me}
          isManager={isManager}
          onClose={closeForm}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
