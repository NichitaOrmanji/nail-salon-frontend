import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom'
import { useStaffAuth } from '../context/StaffAuthContext'
import { fetchAppointments } from '../api/appointments'
import { fetchStaffMasters, fetchDaysOff, addDayOff, removeDayOff } from '../api/masters'
import { notifyDataChanged, useAutoRefresh } from '../utils/events'
import { todayString, addDays, formatDayTitle, isValidDateString } from '../utils/time'
import { ACTIVE_STATUSES } from '../utils/statuses'
import { buildColumns, buildRange, DISCARD_CONFIRM } from '../utils/journal'
import JournalGrid from '../components/journal/JournalGrid'
import AppointmentCard from '../components/journal/AppointmentCard'
import AppointmentFormModal from '../components/journal/AppointmentFormModal'
import { Button, Checkbox, ErrorText } from '../components/ui'
import { IconChevronLeft, IconChevronRight } from '../components/Icons'
import Spinner from '../../components/layout/Spinner'

// Журнал записей на день.
// Дата и открытая карточка хранятся в адресе: ?date=2026-10-20&open=15.
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

  const [data, setData] = useState(null) // { date, appointments, masters, daysOff }
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
      fetchAppointments({ dateFrom: date }),
      fetchStaffMasters(),
      fetchDaysOff({ dateFrom: date, dateTo: date }),
    ])
      .then(([appointments, masters, daysOff]) => {
        if (requestId !== requestRef.current) return
        setData({ date, appointments, masters, daysOff })
        setLoadError(null)
      })
      .catch(err => {
        if (requestId !== requestRef.current) return
        setLoadError(err.message)
      })
  }, [date])

  useEffect(() => {
    load()
  }, [load])
  useAutoRefresh(load)

  const current = data && data.date === date ? data : null

  // Дата всегда в адресе; по умолчанию запись истории заменяется
  function setParams(next, { push = false, state = historyState } = {}) {
    const params = { date: next.date ?? date }
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

  const columns = useMemo(() => {
    if (!current) return []
    return buildColumns({ masters: current.masters, appointments: visibleAppointments, date, dayOffMasterIds })
  }, [current, visibleAppointments, date, dayOffMasterIds])

  const range = useMemo(() => buildRange(columns, visibleAppointments), [columns, visibleAppointments])

  // Карточка держится по id — опрос журнала её не сбрасывает
  const selected = current && openId ? current.appointments.find(a => a.id === openId) || null : null

  function openCreate(col, time) {
    if (!confirmLeaveCard()) return
    const masterId = col?.master && col.master.is_active !== false ? col.master.id : null
    openForm({ initial: { masterId, date, time } })
  }

  async function toggleDayOff(col) {
    const m = col.master
    setActionError(null)
    try {
      if (col.work.dayOff) {
        await removeDayOff(m.id, date)
      } else {
        const count = current.appointments.filter(a => a.master?.id === m.id && ACTIVE_STATUSES.includes(a.status)).length
        if (count > 0 && !window.confirm(`У мастера ${m.name} ${count} записей в этот день. Записи не отменятся сами. Всё равно сделать выходным?`)) return
        await addDayOff(m.id, date)
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

  const isToday = date === todayString()

  return (
    <div className="h-full flex flex-col">

      {/* Панель дня */}
      <div ref={toolbarRef} className="flex-shrink-0 px-3 md:px-5 py-3 flex flex-wrap items-center gap-2" style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2e2e2e' }}>
        <div className="flex items-center gap-1">
          <Button aria-label="Предыдущий день" className="w-11 px-0" onClick={() => goToDate(addDays(date, -1))}>
            <IconChevronLeft />
          </Button>
          <Button onClick={() => goToDate(todayString())} style={isToday ? { color: '#f472b6' } : undefined}>Сегодня</Button>
          <Button aria-label="Следующий день" className="w-11 px-0" onClick={() => goToDate(addDays(date, 1))}>
            <IconChevronRight />
          </Button>
        </div>
        <input
          type="date"
          aria-label="Дата"
          value={date}
          onChange={e => goToDate(e.target.value)}
          className="min-h-[44px] px-3 rounded-xl text-white text-sm outline-none"
          style={{ backgroundColor: '#242424', border: '1px solid #2e2e2e', colorScheme: 'dark' }}
        />
        <div className="basis-full lg:basis-auto lg:flex-1 min-w-0 text-white text-lg font-semibold truncate lg:pl-2">
          {formatDayTitle(date)}
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
          appointments={visibleAppointments}
          range={range}
          isToday={isToday}
          dataKey={date}
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
