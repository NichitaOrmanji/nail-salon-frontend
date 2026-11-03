import { statusInfo } from '../utils/statuses'

export default function StatusBadge({ status }) {
  const info = statusInfo(status)
  return (
    <span
      className="inline-block text-xs font-medium px-2 py-1 rounded-lg whitespace-nowrap"
      style={{ backgroundColor: 'var(--surface-3)', color: info.color }}
    >
      {info.label}
    </span>
  )
}
