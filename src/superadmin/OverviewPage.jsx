import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Spinner from '../components/layout/Spinner'
import { ErrorText } from '../admin/components/ui'
import { fetchOverview } from './api'
import { ago, formatDate } from './common'
import { Panel } from './ui'

// Цвета серий проверены валидатором палитры на тёмном фоне #1a1a1a
const ONLINE = '#ec4899'
const STAFF = '#3b82f6'

function Tile({ label, value, hint }) {
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e' }}>
      <div className="text-gray-400 text-xs">{label}</div>
      <div className="text-white text-2xl font-semibold mt-1">{value}</div>
      {hint && <div className="text-gray-500 text-xs mt-1">{hint}</div>}
    </div>
  )
}

function shortDay(iso) {
  const [, m, d] = iso.split('-')
  return `${d}.${m}`
}

// Столбики по дням: несколько серий складываются в стопку (2px зазор), подсказка при наведении
function BarChart({ series, keys, label }) {
  const [hover, setHover] = useState(null)
  const height = 160
  const max = Math.max(1, ...series.map(day => keys.reduce((sum, k) => sum + day[k.key], 0)))
  const step = 100 / series.length
  const ticks = [0, Math.round(max / 2), max].filter((v, i, a) => a.indexOf(v) === i)
  const active = hover !== null ? series[hover] : null

  return (
    <div>
      {keys.length > 1 && (
        <div className="flex gap-4 mb-2 text-xs text-gray-400">
          {keys.map(k => (
            <span key={k.key} className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: k.color }} aria-hidden="true" />{k.label}
            </span>
          ))}
        </div>
      )}
      <div className="relative" style={{ height: height + 22 }}>
        <div className="absolute inset-y-0 left-0 w-8 text-[10px] text-gray-500" aria-hidden="true">
          {ticks.map(v => (
            <span key={v} className="absolute right-1" style={{ bottom: 22 + (v / max) * height - 6 }}>{v}</span>
          ))}
        </div>
        <svg className="absolute left-8 right-0 top-0" style={{ width: 'calc(100% - 2rem)' }} height={height + 22}
          role="img" aria-label={label} preserveAspectRatio="none" viewBox={`0 0 100 ${height + 22}`}>
          {ticks.map(v => (
            <line key={v} x1="0" x2="100" y1={height - (v / max) * height} y2={height - (v / max) * height}
              stroke="#2e2e2e" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          {series.map((day, i) => {
            let y = height
            const x = i * step + step * 0.18
            const w = step * 0.64
            return (
              <g key={day.date}>
                {keys.map((k, ki) => {
                  const h = (day[k.key] / max) * height
                  if (h <= 0) return null
                  const gap = ki > 0 ? 2 : 0
                  y -= h
                  return <rect key={k.key} x={x} y={y} width={w} height={Math.max(0, h - gap)} fill={k.color} rx="0.6"
                    opacity={hover === null || hover === i ? 1 : 0.45} />
                })}
                <rect x={i * step} y="0" width={step} height={height} fill="transparent"
                  onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
              </g>
            )
          })}
        </svg>
        <div className="absolute left-8 right-0 bottom-0 flex justify-between text-[10px] text-gray-500" aria-hidden="true">
          <span>{shortDay(series[0].date)}</span>
          <span>{shortDay(series[Math.floor(series.length / 2)].date)}</span>
          <span>{shortDay(series[series.length - 1].date)}</span>
        </div>
        {active && (
          <div className="absolute top-0 pointer-events-none rounded-lg px-2.5 py-1.5 text-xs shadow-lg"
            style={{
              backgroundColor: '#242424', border: '1px solid #3a3a3a',
              left: `calc(2rem + (100% - 2rem) * ${Math.min(0.8, Math.max(0, (hover * step - 5) / 100))})`,
            }}>
            <div className="text-white font-medium">{shortDay(active.date)}</div>
            {keys.map(k => <div key={k.key} className="text-gray-300">{k.label}: {active[k.key]}</div>)}
          </div>
        )}
      </div>
      <details className="mt-2 text-xs text-gray-500">
        <summary className="cursor-pointer">Таблица</summary>
        <table className="mt-2 w-full">
          <tbody>
            {series.filter(d => keys.some(k => d[k.key] > 0)).map(d => (
              <tr key={d.date}><td className="pr-4">{shortDay(d.date)}</td>{keys.map(k => <td key={k.key} className="pr-4">{k.label}: {d[k.key]}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}

function AttentionList({ title, rows, render, empty = 'Нет' }) {
  return (
    <Panel title={`${title} · ${rows.length}`}>
      {rows.length === 0 ? <p className="text-gray-500 text-sm">{empty}</p> : (
        <ul className="space-y-1">
          {rows.map(r => (
            <li key={r.id}>
              <Link to={`/superadmin/salons/${r.id}`} className="flex justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-[#242424]">
                <span className="text-white truncate">{r.name}</span>
                <span className="text-gray-400 whitespace-nowrap">{render(r)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export default function OverviewPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => {
    fetchOverview().then(setData).catch(err => setError(err.message))
  }, [])

  if (error) return <ErrorText>{error}</ErrorText>
  if (!data) return <Spinner />
  const { salons, appointments: a, series, attention } = data
  const staffSeries = series.map(d => ({ ...d, staff: d.appointments - d.online }))
  const onlineShare = a.month ? Math.round((a.month_online / a.month) * 100) : 0

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile label="Салонов" value={salons.total} hint={`работают ${salons.by_status.active || 0} · ждут email ${salons.by_status.pending || 0} · заблок. ${salons.by_status.blocked || 0}`} />
        <Tile label="На пробном периоде" value={salons.trial.active + salons.trial.ending} hint={`кончается ${salons.trial.ending} · кончился ${salons.trial.expired}`} />
        <Tile label="Записей создано сегодня" value={a.today} hint={`за 7 дней ${a.week} · визитов сегодня ${a.visits_today}`} />
        <Tile label="Записей за 30 дней" value={a.month} hint={`онлайн ${onlineShare}%`} />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Новые записи по дням">
          <BarChart series={staffSeries} label="Новые записи по дням за 30 дней"
            keys={[{ key: 'online', label: 'Онлайн', color: ONLINE }, { key: 'staff', label: 'Персонал', color: STAFF }]} />
        </Panel>
        <Panel title="Регистрации салонов по дням">
          <BarChart series={series} label="Регистрации салонов по дням за 30 дней"
            keys={[{ key: 'signups', label: 'Регистраций', color: ONLINE }]} />
        </Panel>
      </div>
      <h2 className="text-white font-semibold pt-2">Требуют внимания</h2>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AttentionList title="Пробный кончается" rows={attention.trial_ending} render={r => `до ${formatDate(r.trial_ends_at)}`} />
        <AttentionList title="Пробный кончился" rows={attention.trial_expired} render={r => formatDate(r.trial_ends_at)} />
        <AttentionList title="Не подтвердили email" rows={attention.unverified} render={r => `с ${formatDate(r.created_at)}`} />
        <AttentionList title="Не заходили 7+ дней" rows={attention.inactive} render={r => ago(r.last_activity_at)} />
        <AttentionList title="Нет мастеров или услуг" rows={attention.not_ready} render={r => `мастеров ${r.masters} · услуг ${r.services}`} />
      </div>
    </>
  )
}
