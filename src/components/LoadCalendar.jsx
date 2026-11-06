import { t } from '../i18n'
import { toDateString } from '../utils/format'

// Переводятся при показе: константа модуля не знает о смене языка
const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const DAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

const R = 17
const CIRCLE = 2 * Math.PI * R

// Цвет кольца по загруженности дня: свободно → почти занято → занято
function loadColor(load, full) {
  if (full || load >= 0.85) return '#f87171'
  if (load >= 0.5) return '#fbbf24'
  return '#34d399'
}

function IconChevron({ dir }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
    </svg>
  )
}

// Календарь месяца с кружками: кольцо вокруг числа заполняется по доле занятого времени дня.
// days — { 'YYYY-MM-DD': { working, load, free } } (нет данных — день без кольца);
// clientMode — выходные, прошедшие и полностью занятые дни нельзя выбрать;
// minMonth — 'YYYY-MM': раньше листать нельзя.
export default function LoadCalendar({
  year, month, onMonthChange, days = {}, selected, onSelect, clientMode = false, minMonth, compact = false,
}) {
  const todayStr = toDateString(new Date())
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
  const atMin = minMonth && monthKey <= minMonth
  const cell = compact ? 34 : 40

  function shift(delta) {
    const d = new Date(year, month + delta, 1)
    onMonthChange(d.getFullYear(), d.getMonth())
  }

  return (
    <div>
      <div className={`flex items-center justify-between ${compact ? 'mb-3' : 'mb-5'}`}>
        <span className="text-white font-semibold text-base">{t(MONTHS[month])} {year}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => shift(-1)}
            disabled={atMin}
            aria-label={t('Предыдущий месяц')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 active:scale-90"
            style={{ backgroundColor: '#242424', opacity: atMin ? 0.3 : 1 }}
          >
            <IconChevron dir="left" />
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label={t('Следующий месяц')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 active:scale-90"
            style={{ backgroundColor: '#242424' }}
          >
            <IconChevron dir="right" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-gray-600 text-xs py-1.5 font-medium">{t(d)}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {Array(firstDay).fill(null).map((_, i) => <div key={`e-${i}`} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1
          const dateStr = toDateString(new Date(year, month, day))
          const info = days[dateStr]
          const isPast = dateStr < todayStr
          const isSelected = selected === dateStr
          const isToday = dateStr === todayStr
          const dayOff = info && !info.working
          const full = info && info.working && !isPast && info.free === 0
          const disabled = clientMode && (isPast || dayOff || full)
          const showRing = info && info.working && !isPast
          const load = full ? 1 : Math.min(Math.max(info?.load || 0, 0), 1)
          const label = !info ? '' : dayOff ? t('выходной') : isPast ? '' : full ? t('всё занято')
            : t('занято {percent}%', { percent: Math.round(load * 100) })

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(dateStr)}
              disabled={disabled}
              aria-pressed={isSelected}
              aria-label={`${day}${label ? `, ${label}` : ''}`}
              title={label || undefined}
              className="relative flex items-center justify-center mx-auto rounded-full text-sm transition-all active:scale-90"
              style={{
                width: cell, height: cell,
                backgroundColor: isSelected ? '#db2777' : 'transparent',
                color: disabled || isPast ? '#4b5563' : dayOff ? '#9ca3af' : '#ffffff',
                fontWeight: isToday ? 700 : 400,
                textDecoration: full && clientMode ? 'line-through' : 'none',
              }}
            >
              {showRing && !isSelected && (
                <svg className="absolute inset-0" viewBox="0 0 40 40" aria-hidden="true">
                  <circle cx="20" cy="20" r={R} fill="none" stroke="#2e2e2e" strokeWidth="2.5" />
                  {load > 0 && (
                    <circle
                      cx="20" cy="20" r={R} fill="none"
                      stroke={loadColor(load, full)} strokeWidth="2.5" strokeLinecap="round"
                      strokeDasharray={`${Math.max(load * CIRCLE, 2)} ${CIRCLE}`}
                      transform="rotate(-90 20 20)"
                    />
                  )}
                </svg>
              )}
              {isToday && !isSelected && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full" style={{ backgroundColor: '#f472b6' }} />
              )}
              <span className="relative">{day}</span>
            </button>
          )
        })}
      </div>

      <div className={`flex flex-wrap gap-x-3 gap-y-1 ${compact ? 'mt-3' : 'mt-4'}`}>
        {[['#34d399', t('свободно')], ['#fbbf24', t('почти занято')], ['#f87171', t('занято')]].map(([color, text]) => (
          <span key={text} className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-2.5 h-2.5 rounded-full" style={{ border: `2px solid ${color}` }} />
            {text}
          </span>
        ))}
      </div>
    </div>
  )
}
