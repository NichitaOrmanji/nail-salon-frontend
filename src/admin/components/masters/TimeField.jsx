import { t } from '../../../i18n'
const timeInputStyle = { backgroundColor: 'var(--c-raised)', border: '1px solid var(--c-line)', colorScheme: 'var(--c-scheme)' }

// Поле времени ЧЧ:ММ с шагом 15 минут; clearable — крестик, чтобы оставить пустым (обед)
export default function TimeField({ value, onChange, label, disabled, clearable }) {
  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="time"
        step={900}
        aria-label={label}
        value={value || ''}
        disabled={disabled}
        onChange={e => onChange(e.target.value.slice(0, 5) || null)}
        className="min-h-[40px] px-2 rounded-lg text-ink text-sm outline-none"
        style={timeInputStyle}
      />
      {clearable && value && !disabled && (
        <button type="button" onClick={() => onChange(null)} aria-label={t('Очистить: {label}', { label })}
          className="w-7 h-7 rounded-lg text-gray-400 text-sm" style={{ backgroundColor: 'var(--c-raised)' }}>
          ×
        </button>
      )}
    </span>
  )
}
