import { STATUS } from './common'

export function Panel({ title, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl p-5 ${className}`} style={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e' }}>
      {(title || action) && (
        <div className="flex items-center gap-3 mb-4">
          {title && <h2 className="text-white text-base font-semibold">{title}</h2>}
          {action && <div className="ml-auto">{action}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatusPill({ status }) {
  const info = STATUS[status] || { label: status, color: '#9ca3af' }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap" style={{ color: '#d1d5db' }}>
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info.color }} aria-hidden="true" />
      {info.label}
    </span>
  )
}
