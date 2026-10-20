import { statusInfo } from '../utils/statuses'

export default function StatusBadge({ status }) {
  const info = statusInfo(status)
  return (
    <span
      className="inline-block text-xs font-medium px-2 py-1 rounded-lg whitespace-nowrap"
      style={{ backgroundColor: '#2e2e2e', color: info.color }}
    >
      {info.label}
    </span>
  )
}
