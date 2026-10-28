import { useEffect, useState } from 'react'
import { fetchSummary } from '../../api/finance'
import { formatMoney, METHODS } from '../../utils/money'
import { formatShortDate } from '../../utils/time'
import { ErrorText, WarningText } from '../ui'
import Stat, { Section, Table } from './Stat'
import Spinner from '../../../components/layout/Spinner'

// Отчёт за период: выручка, расходы, зарплаты, прибыль; по способам оплаты, мастерам и дням
export default function ReportTab({ range }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchSummary(range)
      .then(result => { if (!cancelled) { setData(result); setError(null) } })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [range])

  if (error) return <ErrorText>{error}</ErrorText>
  if (!data) return <Spinner />

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Stat label="Выручка" value={formatMoney(data.revenue)} hint={`${data.visits} визитов`} color="#34d399" />
        <Stat label="Средний чек" value={formatMoney(data.average_check)} hint={`скидки ${formatMoney(data.discounts)}`} />
        <Stat label="Расходы" value={formatMoney(data.expenses)} hint={`из них зарплаты ${formatMoney(data.salaries)}`} color="#f87171" />
        <Stat label="Прочие приходы" value={formatMoney(data.other_income)} />
        <Stat label="Прибыль" value={formatMoney(data.profit)} hint="выручка + приходы − расходы" color={Number(data.profit) < 0 ? '#f87171' : '#f472b6'} />
      </div>

      {(data.unpaid_visits > 0 || data.no_shows > 0) && (
        <div className="mt-4 space-y-1">
          {data.unpaid_visits > 0 && <WarningText>Визитов «Пришёл» без оплаты: {data.unpaid_visits} — они не попали в выручку и зарплаты.</WarningText>}
          {data.no_shows > 0 && <p className="text-gray-500 text-sm">Клиентов «Не пришёл»: {data.no_shows}</p>}
        </div>
      )}

      <Section title="По способам оплаты">
        <div className="grid grid-cols-3 gap-3">
          {METHODS.map(m => <Stat key={m.key} label={m.label} value={formatMoney(data.by_method[m.key])} />)}
        </div>
      </Section>

      <Section title="По мастерам">
        <Table
          rows={data.by_master}
          rowKey={r => r.id ?? 'none'}
          columns={[
            { key: 'name', label: 'Мастер' },
            { key: 'visits', label: 'Визитов', align: 'right' },
            { key: 'revenue', label: 'Выручка', align: 'right', render: r => formatMoney(r.revenue) },
          ]}
        />
      </Section>

      <Section title="По дням">
        <Table
          rows={data.by_day}
          rowKey={r => r.date}
          columns={[
            { key: 'date', label: 'День', render: r => formatShortDate(r.date) },
            { key: 'visits', label: 'Визитов', align: 'right' },
            { key: 'revenue', label: 'Выручка', align: 'right', render: r => formatMoney(r.revenue) },
          ]}
        />
      </Section>

      <Section title="Расходы по категориям">
        <Table
          rows={data.expense_categories}
          rowKey={r => r.category}
          empty="Расходов нет"
          columns={[
            { key: 'category', label: 'Категория' },
            { key: 'amount', label: 'Сумма', align: 'right', render: r => formatMoney(r.amount) },
          ]}
        />
      </Section>
    </div>
  )
}
