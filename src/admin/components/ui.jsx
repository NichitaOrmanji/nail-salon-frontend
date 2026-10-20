// Общие элементы панели: кнопки, поля, сообщения. Цвета — как в клиентской части.

const BUTTON_STYLES = {
  primary: { backgroundColor: '#f472b6', color: '#ffffff' },
  secondary: { backgroundColor: '#242424', color: '#ffffff', border: '1px solid #2e2e2e' },
  danger: { backgroundColor: '#242424', color: '#f87171', border: '1px solid #2e2e2e' },
  ghost: { backgroundColor: 'transparent', color: '#9ca3af' },
}

// Кнопка действия: высота не меньше 44px (удобно пальцем)
export function Button({ variant = 'secondary', className = '', style, disabled, children, type = 'button', ...props }) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`min-h-[44px] px-4 rounded-xl text-sm font-medium transition-all active:scale-95 inline-flex items-center justify-center gap-2 ${className}`}
      style={{ ...BUTTON_STYLES[variant], opacity: disabled ? 0.5 : 1, ...style }}
      {...props}
    >
      {children}
    </button>
  )
}

// Подпись + поле
export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="block text-gray-400 text-xs font-medium mb-1.5">{label}</span>}
      {children}
      {hint && <span className="block text-gray-500 text-xs mt-1">{hint}</span>}
    </label>
  )
}

const inputClass = 'w-full min-h-[44px] px-3 py-2 rounded-xl text-white text-sm outline-none placeholder-gray-600 focus:ring-1 focus:ring-pink-400'
const inputStyle = { backgroundColor: '#242424', border: '1px solid #2e2e2e', colorScheme: 'dark' }

export function TextInput({ className = '', style, ...props }) {
  return <input className={`${inputClass} ${className}`} style={{ ...inputStyle, ...style }} {...props} />
}

export function TextArea({ className = '', style, rows = 3, ...props }) {
  return <textarea rows={rows} className={`${inputClass} resize-none ${className}`} style={{ ...inputStyle, ...style }} {...props} />
}

export function Select({ className = '', style, children, ...props }) {
  return (
    <select className={`${inputClass} ${className}`} style={{ ...inputStyle, ...style }} {...props}>
      {children}
    </select>
  )
}

export function Checkbox({ checked, onChange, label, disabled, className = '' }) {
  return (
    <label className={`flex items-center gap-3 min-h-[44px] cursor-pointer select-none ${disabled ? 'opacity-60 cursor-default' : ''} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange?.(e.target.checked)}
        className="w-5 h-5 flex-shrink-0"
        style={{ accentColor: '#f472b6' }}
      />
      <span className="text-sm text-white min-w-0">{label}</span>
    </label>
  )
}

export function ErrorText({ children, className = '' }) {
  if (!children) return null
  return <p className={`text-red-400 text-sm ${className}`}>{children}</p>
}

export function WarningText({ children, className = '' }) {
  if (!children) return null
  return (
    <p className={`text-sm rounded-xl px-3 py-2 ${className}`} style={{ color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
      {children}
    </p>
  )
}

// Заголовок страницы с кнопками справа
export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div className="min-w-0">
        <h1 className="text-white text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  )
}
