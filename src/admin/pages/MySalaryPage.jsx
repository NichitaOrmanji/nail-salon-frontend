import { useEffect, useState } from 'react'
import { fetchMySalary } from '../api/finance'
import { ErrorText, PageHeader } from '../components/ui'
import PeriodPicker from '../components/PeriodPicker'
import Stat, { Section, Table } from '../components/finance/Stat'
import { formatMoney, presetRange } from '../utils/money'
import { formatShortDate } from '../utils/time'
import Spinner from '../../components/layout/Spinner'
import { t } from '../../i18n'

// Зарплата мастера: начислено за период, выплачено, к выплате и оплаченные визиты
export default function MySalaryPage() {
  const [range, setRange] = useState(() => presetRange('month'))
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchMySalary(range)
      .then(result => { if (!cancelled) { setData(result); setError(null) } })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [range])

  const scheme = data?.scheme
  const schemeParts = scheme ? [
    Number(scheme.percent) ? t('{value} % от оплаченных визитов', { value: Number(scheme.percent) }) : null,
    Number(scheme.fixed_per_day) ? t('{value} за рабочий день', { value: formatMoney(scheme.fixed_per_day) }) : null,
  ].filter(Boolean) : []

  return (
    <div className="px-4 md:px-6 py-5 max-w-4xl">
      <PageHeader title={t('Моя зарплата')} subtitle={schemeParts.length ? t('Схема: {value}', { value: schemeParts.join(' + ') }) : t('Схема оплаты ещё не задана владельцем')} />
      <div className="mb-5"><PeriodPicker value={range} onChange={setRange} /></div>
      <ErrorText>{error}</ErrorText>
      {!data && !error && <Spinner />}
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label={t('Начислено')} value={formatMoney(data.accrued)} hint={t('{visits} визитов, {days} дн.', { visits: data.visits, days: data.days })} color="#34d399" />
            <Stat label={t('Выплачено')} value={formatMoney(data.paid)} />
            <Stat label={t('К выплате')} value={formatMoney(data.due)} color="#f472b6" />
            <Stat label={t('Выручка по визитам')} value={formatMoney(data.revenue)} />
          </div>
          <Section title={t('Оплаченные визиты')}>
            <Table
              rows={data.visits_list}
              rowKey={r => `${r.date}-${r.time}`}
              empty={t('За период оплаченных визитов нет')}
              columns={[
                { key: 'date', label: t('День'), render: r => formatShortDate(r.date) },
                { key: 'time', label: t('Время') },
                { key: 'service', label: t('Услуга'), render: r => r.service || '—' },
                { key: 'amount', label: t('Сумма'), align: 'right', render: r => formatMoney(r.amount) },
              ]}
            />
          </Section>
        </>
      )}
    </div>
  )
}
