import { PRESETS, presetRange } from '../utils/money'

const inputStyle = { backgroundColor: '#242424', border: '1px solid #2e2e2e', colorScheme: 'dark' }

// Период отчёта: быстрые кнопки и две даты. value — { dateFrom, dateTo }
export default function PeriodPicker({ value, onChange }) {
  const active = PRESETS.find(p => {
    const range = presetRange(p.key)
    return range.dateFrom === value.dateFrom && range.dateTo === value.dateTo
  })?.key

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #2e2e2e' }} role="group" aria-label="Период">
        {PRESETS.map(p => (
          <button
            key={p.key}
            type="button"
            aria-pressed={active === p.key}
            onClick={() => onChange(presetRange(p.key))}
            className="min-h-[44px] px-3 text-sm font-medium"
            style={{ backgroundColor: active === p.key ? '#db2777' : '#242424', color: active === p.key ? '#ffffff' : '#9ca3af' }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <input
          type="date"
          aria-label="С даты"
          value={value.dateFrom}
          max={value.dateTo}
          onChange={e => e.target.value && onChange({ ...value, dateFrom: e.target.value })}
          className="min-h-[44px] px-3 rounded-xl text-white text-sm outline-none"
          style={inputStyle}
        />
        <span className="text-gray-500">—</span>
        <input
          type="date"
          aria-label="По дату"
          value={value.dateTo}
          min={value.dateFrom}
          onChange={e => e.target.value && onChange({ ...value, dateTo: e.target.value })}
          className="min-h-[44px] px-3 rounded-xl text-white text-sm outline-none"
          style={inputStyle}
        />
      </div>
    </div>
  )
}
