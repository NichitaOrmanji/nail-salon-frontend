import { addDays, timeToMin, todayString, weekdayIndex } from './time'

// Сетка журнала: 30 минут = 48px
export const SLOT_MINUTES = 30
export const SLOT_PX = 48
export const PX_PER_MIN = SLOT_PX / SLOT_MINUTES
export const MIN_BLOCK_PX = 24

// Вопрос перед закрытием формы или карточки с несохранённым вводом
export const DISCARD_CONFIRM = 'Есть несохранённые изменения. Закрыть без сохранения?'

const DEFAULT_START = 9 * 60
const DEFAULT_END = 20 * 60

// Рабочие дни по датам ([{ master, date, ... }]) → Map «id мастера|дата» → день
export function workDaysMap(workDays = []) {
  return new Map(workDays.map(d => [`${d.master}|${d.date}`, d]))
}

// Рабочие часы мастера в этот день: { working, dayOff, start, end, breakStart, breakEnd } (минуты).
// Как на сервере: выходной по дате → свои часы на дату (customDays) → недельный график
export function workInfo(master, date, dayOffMasterIds, customDays = new Map()) {
  if (!master) return { working: false, neutral: true }
  if (dayOffMasterIds.has(master.id)) return { working: false, dayOff: true }
  const day = customDays.get(`${master.id}|${date}`) || (Array.isArray(master.schedule)
    ? master.schedule.find(s => s.day_of_week === weekdayIndex(date) && s.is_working)
    : null)
  if (!day) return { working: false }
  const start = timeToMin(day.start_time)
  const end = timeToMin(day.end_time)
  if (start === null || end === null || end <= start) return { working: false }
  const breakStart = day.break_start ? timeToMin(day.break_start) : null
  const breakEnd = day.break_end ? timeToMin(day.break_end) : null
  const hasBreak = breakStart !== null && breakEnd !== null && breakStart < breakEnd
  return { working: true, start, end, breakStart: hasBreak ? breakStart : null, breakEnd: hasBreak ? breakEnd : null }
}

// Понедельник недели, в которую входит дата
export function weekStart(date) {
  return addDays(date, -weekdayIndex(date))
}

export function weekDates(date) {
  const start = weekStart(date)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

// Часы работы дня по всем мастерам вместе: от самого раннего начала до самого позднего конца
function unionWork(masters, date, dayOffMasterIds, customDays) {
  const days = masters.filter(m => m.is_active).map(m => workInfo(m, date, dayOffMasterIds, customDays)).filter(w => w.working)
  if (!days.length) return { working: false }
  return { working: true, start: Math.min(...days.map(w => w.start)), end: Math.max(...days.map(w => w.end)) }
}

// Колонки недели: 7 дней. master — фильтр (null — все мастера, записи которых стоят рядом)
export function buildWeekColumns({ masters, appointments = [], date, master, dayOffs, workDays = [] }) {
  const today = todayString()
  const customDays = workDaysMap(workDays)
  return weekDates(date).map(day => {
    const offIds = new Set(dayOffs.filter(d => d.date === day).map(d => d.master))
    // «Все мастера»: у каждого мастера в дне своя подколонка — работающие в этот день
    // и те, у кого есть записи (порядок как в списке мастеров)
    const withAppointments = new Set(appointments.filter(a => a.date === day).map(a => a.master?.id ?? 'none'))
    const laneIds = master ? null : [
      ...masters.filter(m => withAppointments.has(m.id) || (m.is_active && workInfo(m, day, offIds, customDays).working)).map(m => m.id),
      ...(withAppointments.has('none') ? ['none'] : []),
    ]
    const names = new Map(masters.map(m => [m.id, m.name]))
    return {
      laneIds,
      laneNames: laneIds?.map(id => (id === 'none' ? 'Без мастера' : names.get(id) || '')),
      key: day,
      date: day,
      week: true,
      isToday: day === today,
      master,
      hidden: false,
      work: master ? workInfo(master, day, offIds, customDays) : unionWork(masters, day, offIds, customDays),
      match: a => a.date === day && (master ? a.master?.id === master.id : true),
    }
  })
}

// Колонки дня: активные мастера ∪ скрытые мастера с записями ∪ «Без мастера»
export function buildColumns({ masters, appointments, date, dayOffMasterIds, workDays = [] }) {
  const customDays = workDaysMap(workDays)
  const columns = []
  const seen = new Set()
  const withAppointments = new Set(appointments.filter(a => a.master).map(a => a.master.id))

  for (const m of masters) {
    if (m.is_active || withAppointments.has(m.id)) {
      columns.push({ key: `m${m.id}`, master: m, hidden: !m.is_active, work: workInfo(m, date, dayOffMasterIds, customDays) })
      seen.add(m.id)
    }
  }
  // Мастер записи, которого нет в списке (на всякий случай) — колонка по данным записи
  for (const a of appointments) {
    if (a.master && !seen.has(a.master.id)) {
      seen.add(a.master.id)
      columns.push({
        key: `m${a.master.id}`,
        master: { id: a.master.id, name: a.master.name, is_active: a.master.is_active, schedule: [] },
        hidden: a.master.is_active === false,
        work: dayOffMasterIds.has(a.master.id) ? { working: false, dayOff: true } : { working: false },
      })
    }
  }
  if (appointments.some(a => !a.master)) {
    columns.push({ key: 'none', master: null, hidden: false, work: { working: false, neutral: true } })
  }
  const isToday = date === todayString()
  return columns.map(col => ({
    ...col,
    date,
    isToday,
    match: a => a.date === date && (col.master ? a.master?.id === col.master.id : !a.master),
  }))
}

// Диапазон часов сетки, округлённый до часа
export function buildRange(columns, appointments) {
  const starts = []
  const ends = []
  for (const col of columns) {
    if (col.work.working) {
      starts.push(col.work.start)
      ends.push(col.work.end)
    }
  }
  for (const a of appointments) {
    const s = timeToMin(a.start_time)
    const e = timeToMin(a.end_time)
    if (s !== null) starts.push(s)
    if (e !== null) ends.push(Math.max(e, (s ?? 0) + 1))
  }
  if (!starts.length || !ends.length) return { start: DEFAULT_START, end: DEFAULT_END }
  const start = Math.max(0, Math.floor(Math.min(...starts) / 60) * 60)
  let end = Math.min(24 * 60, Math.ceil(Math.max(...ends) / 60) * 60)
  if (end <= start) end = Math.min(24 * 60, start + 60)
  return { start, end }
}

// Пересекающиеся записи в одной колонке делят ширину: { [id]: { lane, lanes } }
export function layoutBlocks(appointments) {
  const items = appointments
    .map(a => {
      const start = timeToMin(a.start_time) ?? 0
      const end = Math.max(timeToMin(a.end_time) ?? start, start + 1)
      return { id: a.id, start, end }
    })
    .sort((x, y) => x.start - y.start || y.end - x.end)

  const result = {}
  let cluster = []
  let clusterEnd = -1
  let laneEnds = []

  function flush() {
    for (const item of cluster) result[item.id].lanes = laneEnds.length
    cluster = []
    laneEnds = []
  }

  for (const item of items) {
    if (cluster.length && item.start >= clusterEnd) flush()
    let lane = laneEnds.findIndex(end => end <= item.start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(item.end)
    } else {
      laneEnds[lane] = item.end
    }
    result[item.id] = { lane, lanes: 1 }
    cluster.push(item)
    clusterEnd = cluster.length === 1 ? item.end : Math.max(clusterEnd, item.end)
  }
  if (cluster.length) flush()
  return result
}
