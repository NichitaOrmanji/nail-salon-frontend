import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cancelPayment, fetchMyRevenue } from '../api/finance'
import { Button, ErrorText, PageHeader } from '../components/ui'
import PeriodPicker from '../components/PeriodPicker'
import Stat, { Section } from '../components/finance/Stat'
import { formatMoney, methodLabel, presetRange } from '../utils/money'
import { formatShortDate } from '../utils/time'
import Spinner from '../../components/layout/Spinner'
import { t } from '../../i18n'

const rowStyle = { backgroundColor: 'var(--c-surface)', border: '1px solid var(--c-line)' }

// Выручка мастера, который работает сам: сколько заплатили клиенты, наличными и картой, и что ещё не оплачено
export default function MyRevenuePage() {
  const [range, setRange] = useState(() => presetRange('today'))
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchMyRevenue(range)
      .then(result => { if (!cancelled) { setData(result); setError(null) } })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [range, reload])

  async function unpay(row) {
    if (!window.confirm(t('Отменить оплату визита {client}? Визит снова станет неоплаченным.', { client: row.client_name }))) return
    setBusyId(row.id)
    try {
      await cancelPayment(row.appointment)
      setReload(n => n + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="px-4 md:px-6 py-5 max-w-3xl">
      <PageHeader title={t('Моя выручка')} subtitle={t('Сколько заплатили ваши клиенты')} />
      <div className="mb-5"><PeriodPicker value={range} onChange={setRange} /></div>
      <ErrorText>{error}</ErrorText>
      {!data && !error && <Spinner />}
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label={t('Выручка')} value={formatMoney(data.revenue)} hint={t('{visits} визитов', { visits: data.visits })} color="var(--c-ok)" />
            <Stat label={t('Наличными')} value={formatMoney(data.by_method.cash)} />
            <Stat label={t('Картой')} value={formatMoney(data.by_method.card)} />
            <Stat label={t('Средний чек')} value={formatMoney(data.average_check)} />
          </div>
          {Number(data.by_method.transfer) > 0 && (
            <p className="text-gray-500 text-sm mt-2">{t('Переводом')}: {formatMoney(data.by_method.transfer)}</p>
          )}

          {data.unpaid.length > 0 && (
            <Section title={t('Ждут оплаты')}>
              <div className="space-y-2">
                {data.unpaid.map(row => (
                  <Link key={row.appointment} to={`/admin-panel?date=${row.date}&view=day&open=${row.appointment}`}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3" style={rowStyle}>
                    <div className="flex-1 min-w-0">
                      <div className="text-ink text-sm font-medium truncate">{row.client_name}</div>
                      <div className="text-gray-500 text-xs truncate">
                        {formatShortDate(row.date)}, {row.time}{row.service ? ` · ${row.service}` : ''}
                      </div>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: 'var(--c-warn)' }}>{formatMoney(row.price)}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--accent-ink)' }}>{t('Оплатить')} ›</span>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          <Section title={t('Оплаченные визиты')}>
            {data.payments.length === 0 ? (
              <p className="text-gray-500 text-sm">{t('За период оплаченных визитов нет')}</p>
            ) : (
              <div className="space-y-2">
                {data.payments.map(row => (
                  <div key={row.id} className="flex items-center gap-3 rounded-2xl px-4 py-3" style={rowStyle}>
                    <div className="flex-1 min-w-0">
                      <div className="text-ink text-sm font-medium truncate">{row.client_name}</div>
                      <div className="text-gray-500 text-xs truncate">
                        {formatShortDate(row.date)}, {row.time}{row.service ? ` · ${row.service}` : ''} · {methodLabel(row.method)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-ink text-sm font-semibold">{formatMoney(row.amount)}</div>
                      {row.can_cancel && (
                        <Button className="mt-1 text-xs" disabled={busyId === row.id} onClick={() => unpay(row)}>
                          {t('Отменить')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  )
}
