import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Spinner from '../components/layout/Spinner'
import { ErrorText, Select, TextInput } from '../admin/components/ui'
import { fetchSalons } from './api'
import { TRIAL, ago, formatDate } from './common'
import { Panel, StatusPill } from './ui'

function readFilters() {
  try { return JSON.parse(sessionStorage.getItem('super_salon_filters')) || {} } catch { return {} }
}

// Список всех салонов платформы: поиск, фильтры, сортировка
export default function SalonsPage() {
  const saved = readFilters()
  const [q, setQ] = useState(saved.q || '')
  const [status, setStatus] = useState(saved.status || '')
  const [trial, setTrial] = useState(saved.trial || '')
  const [sort, setSort] = useState(saved.sort || 'new')
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    try { sessionStorage.setItem('super_salon_filters', JSON.stringify({ q, status, trial, sort })) } catch { /* недоступно */ }
    let alive = true
    const timer = setTimeout(() => {
      fetchSalons({ q: q.trim() || undefined, status: status || undefined, trial: trial || undefined, sort })
        .then(data => { if (alive) { setRows(data); setError(null) } })
        .catch(err => { if (alive) setError(err.message) })
    }, q ? 300 : 0)
    return () => { alive = false; clearTimeout(timer) }
  }, [q, status, trial, sort])

  return (
    <Panel title={rows ? `Салоны · ${rows.length}` : 'Салоны'}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <TextInput value={q} onChange={e => setQ(e.target.value)} placeholder="Название, адрес сайта, email, телефон" aria-label="Поиск салона" />
        <Select value={status} onChange={e => setStatus(e.target.value)} aria-label="Статус">
          <option value="">Все статусы</option>
          <option value="active">Работают</option>
          <option value="pending">Ждут подтверждения email</option>
          <option value="blocked">Заблокированы</option>
        </Select>
        <Select value={trial} onChange={e => setTrial(e.target.value)} aria-label="Пробный период">
          <option value="">Любой пробный период</option>
          <option value="active">Идёт</option>
          <option value="ending">Кончается (3 дня)</option>
          <option value="expired">Кончился</option>
          <option value="none">Без пробного периода</option>
        </Select>
        <Select value={sort} onChange={e => setSort(e.target.value)} aria-label="Сортировка">
          <option value="new">Сначала новые</option>
          <option value="old">Сначала старые</option>
          <option value="activity">По активности</option>
          <option value="trial">По концу пробного</option>
          <option value="name">По названию</option>
        </Select>
      </div>
      {error && <ErrorText>{error}</ErrorText>}
      {!rows && !error && <Spinner />}
      {rows && rows.length === 0 && <p className="text-gray-400 text-sm">Ничего не найдено</p>}
      {rows && rows.length > 0 && (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-3 font-medium">Салон</th>
                <th className="py-2 pr-3 font-medium">Статус</th>
                <th className="py-2 pr-3 font-medium">Владелец</th>
                <th className="py-2 pr-3 font-medium">Пробный период</th>
                <th className="py-2 pr-3 font-medium text-right">Мастера / услуги</th>
                <th className="py-2 pr-3 font-medium text-right">Записи (30 дн.)</th>
                <th className="py-2 font-medium">Активность</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} style={{ borderTop: '1px solid #2e2e2e' }}>
                  <td className="py-2.5 pr-3">
                    <Link to={`/superadmin/salons/${r.id}`} className="text-white font-medium hover:underline">{r.name}</Link>
                    <div className="text-gray-500 text-xs">{r.slug} · с {formatDate(r.created_at)}</div>
                  </td>
                  <td className="py-2.5 pr-3"><StatusPill status={r.status} /></td>
                  <td className="py-2.5 pr-3 text-gray-300">
                    <div className="truncate max-w-[200px]">{r.owner?.email || r.owner?.username || '—'}</div>
                    {r.phone && <div className="text-gray-500 text-xs">{r.phone}</div>}
                  </td>
                  <td className="py-2.5 pr-3 text-gray-300">
                    <div>{TRIAL[r.trial]}</div>
                    {r.trial_ends_at && <div className="text-gray-500 text-xs">до {formatDate(r.trial_ends_at)}</div>}
                  </td>
                  <td className="py-2.5 pr-3 text-right text-gray-300">{r.masters} / {r.services}</td>
                  <td className="py-2.5 pr-3 text-right text-gray-300">{r.appointments} ({r.appointments_month})</td>
                  <td className="py-2.5 text-gray-300 whitespace-nowrap">{ago(r.last_activity_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}
