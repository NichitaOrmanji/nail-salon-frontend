// Плитка показателя: подпись, значение, пояснение
export default function Stat({ label, value, hint, color }) {
  return (
    <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e' }}>
      <div className="text-gray-500 text-xs">{label}</div>
      <div className="text-xl font-bold mt-1 truncate" style={{ color: color || '#ffffff' }}>{value}</div>
      {hint && <div className="text-gray-500 text-xs mt-0.5 truncate">{hint}</div>}
    </div>
  )
}

export function Section({ title, children, action }) {
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h2 className="text-white text-base font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

// Таблица: columns — [{ key, label, align, render }]
export function Table({ columns, rows, empty = 'Нет данных', rowKey = r => r.id }) {
  if (!rows.length) return <p className="text-gray-500 text-sm">{empty}</p>
  return (
    <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid #2e2e2e' }}>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: '#1a1a1a' }}>
            {columns.map(c => (
              <th key={c.key} className={`px-3 py-2 font-medium text-gray-500 whitespace-nowrap ${c.align === 'right' ? 'text-right' : 'text-left'}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={rowKey(row)} style={{ borderTop: '1px solid #2e2e2e' }}>
              {columns.map(c => (
                <td key={c.key} className={`px-3 py-2 text-white whitespace-nowrap ${c.align === 'right' ? 'text-right' : ''}`}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
