import { timeToMin, weekdayIndex } from './time'

// Сетка журнала: 30 минут = 48px
export const SLOT_MINUTES = 30
export const SLOT_PX = 48
export const PX_PER_MIN = SLOT_PX / SLOT_MINUTES
export const MIN_BLOCK_PX = 24

// Вопрос перед закрытием формы или карточки с несохранённым вводом
export const DISCARD_CONFIRM = 'Есть несохранённые изменения. Закрыть без сохранения?'

const DEFAULT_START = 9 * 60
const DEFAULT_END = 20 * 60

// Рабочие часы мастера в этот день: { working, dayOff, start, end }
export function workInfo(master, date, dayOffMasterIds) {
  if (!master) return { working: false, neutral: true }
  if (dayOffMasterIds.has(master.id)) return { working: false, dayOff: true }
  const day = Array.isArray(master.schedule)
    ? master.schedule.find(s => s.day_of_week === weekdayIndex(date))
    : null
  if (!day || !day.is_working) return { working: false }
  const start = timeToMin(day.start_time)
  const end = timeToMin(day.end_time)
  if (start === null || end === null || end <= start) return { working: false }
  return { working: true, start, end }
}

// Колонки дня: активные мастера ∪ скрытые мастера с записями ∪ «Без мастера»
export function buildColumns({ masters, appointments, date, dayOffMasterIds }) {
  const columns = []
  const seen = new Set()
  const withAppointments = new Set(appointments.filter(a => a.master).map(a => a.master.id))

  for (const m of masters) {
    if (m.is_active || withAppointments.has(m.id)) {
      columns.push({ key: `m${m.id}`, master: m, hidden: !m.is_active, work: workInfo(m, date, dayOffMasterIds) })
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
  return columns
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
