// Слоты по времени суток: утро — до 12:00, день — до 17:00, вечер — после
const GROUPS = [
  { key: 'morning', label: 'Утро', test: slot => slot < '12:00' },
  { key: 'day', label: 'День', test: slot => slot >= '12:00' && slot < '17:00' },
  { key: 'evening', label: 'Вечер', test: slot => slot >= '17:00' },
]

export function groupSlots(slots) {
  return GROUPS.map(g => ({ ...g, slots: slots.filter(g.test) })).filter(g => g.slots.length)
}
