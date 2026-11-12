import { useCallback, useEffect, useState } from 'react'
import { cancelPayout, fetchSalaries, paySalary, saveSalaryScheme } from '../../api/finance'
import { formatMoney, METHODS } from '../../utils/money'
import { formatShortDate, normalizeDecimal } from '../../utils/time'
import { Button, ErrorText, Field, Select, TextInput } from '../ui'
import Modal from '../Modal'
import { Table } from './Stat'
import Spinner from '../../../components/layout/Spinner'
import { t } from '../../../i18n'

function SchemeModal({ row, onClose, onSaved }) {
  const [percent, setPercent] = useState(row.scheme.percent === '0.00' ? '' : String(Number(row.scheme.percent)))
  const [fixed, setFixed] = useState(row.scheme.fixed_per_day === '0.00' ? '' : String(Number(row.scheme.fixed_per_day)))
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await saveSalaryScheme(row.master.id, {
        percent: normalizeDecimal(percent) || '0',
        fixed_per_day: normalizeDecimal(fixed) || '0',
      })
      onSaved()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <Modal title={t('Схема оплаты: {name}', { name: row.master.name })} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t('Процент от оплаченных визитов, %')} hint={t('Считается от суммы после скидки')}>
          <TextInput inputMode="decimal" value={percent} onChange={e => setPercent(e.target.value)} placeholder="0" />
        </Field>
        <Field label={t('Фикс за рабочий день, L')} hint={t('День, в который у мастера был хотя бы один оплаченный визит')}>
          <TextInput inputMode="decimal" value={fixed} onChange={e => setFixed(e.target.value)} placeholder="0" />
        </Field>
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{t('Отмена')}</Button>
          <Button type="submit" variant="primary" disabled={saving}>{saving ? t('Сохраняем...') : t('Сохранить')}</Button>
        </div>
      </form>
    </Modal>
  )
}

function PayoutModal({ row, range, onClose, onSaved }) {
  const [amount, setAmount] = useState(Number(row.due) > 0 ? String(Number(row.due)) : '')
  const [method, setMethod] = useState('cash')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await paySalary(row.master.id, { date_from: range.dateFrom, date_to: range.dateTo, amount: normalizeDecimal(amount), method })
      onSaved()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <Modal title={t('Выплата: {name}', { name: row.master.name })} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {row.overlapping_payouts?.length > 0 && (
          <p role="alert" className="text-amber-400 text-sm">
            {t('Внимание: часть этих дней уже оплачена —')}{' '}{overlapText(row.overlapping_payouts)}
          </p>
        )}
        <p className="text-gray-400 text-sm">
          {t('За период')}{' '}{formatShortDate(range.dateFrom)} — {formatShortDate(range.dateTo)}{t('. Начислено')}{' '}{formatMoney(row.accrued)}{t(', уже выплачено')}{' '}{formatMoney(row.paid)}{t('. Выплата пройдёт расходом по кассе.')}
        </p>
        <Field label={t('Сумма, L')}>
          <TextInput inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} required />
        </Field>
        <Field label={t('Способ')}>
          <Select value={method} onChange={e => setMethod(e.target.value)}>
            {METHODS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
          </Select>
        </Field>
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{t('Отмена')}</Button>
          <Button type="submit" variant="primary" disabled={saving || !amount}>{saving ? t('Сохраняем...') : t('Выплатить')}</Button>
        </div>
      </form>
    </Modal>
  )
}

function overlapText(payouts) {
  return payouts.map(p => `${formatShortDate(p.date_from)} — ${formatShortDate(p.date_to)}: ${formatMoney(p.amount)}`).join('; ')
}

function schemeText(scheme) {
  const parts = []
  if (Number(scheme.percent)) parts.push(`${Number(scheme.percent)} %`)
  if (Number(scheme.fixed_per_day)) parts.push(t('{value}/день', { value: formatMoney(scheme.fixed_per_day) }))
  return parts.join(' + ') || t('не задана')
}

// Зарплаты мастеров за период: начислено (% + фикс), выплачено, к выплате
export default function SalariesTab({ range }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null) // { type: 'scheme' | 'payout', row }

  const load = useCallback(() => (
    fetchSalaries(range)
      .then(result => { setRows(result); setError(null) })
      .catch(err => setError(err.message))
  ), [range])

  useEffect(() => {
    let cancelled = false
    fetchSalaries(range)
      .then(result => { if (!cancelled) { setRows(result); setError(null) } })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [range])

  async function undoPayout(payout) {
    if (!window.confirm(t('Отменить выплату {value}? Расход по кассе тоже удалится.', { value: formatMoney(payout.amount) }))) return
    try {
      await cancelPayout(payout.id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  function closeAndReload() {
    setModal(null)
    load()
  }

  if (error && !rows) return <ErrorText>{error}</ErrorText>
  if (!rows) return <Spinner />

  return (
    <div>
      <ErrorText className="mb-3">{error}</ErrorText>
      {rows.some(r => r.overlapping_payouts?.length) && (
        <div role="alert" className="rounded-xl px-3 py-2.5 mb-3 text-sm" style={{ backgroundColor: 'rgba(251,191,36,0.1)', border: '1px solid #92400e', color: '#fbbf24' }}>
          <div className="font-medium">{t('Есть выплаты, которые частично захватывают этот период')}</div>
          <div className="text-xs mt-1 text-amber-200/80">{t('Они не входят в «Выплачено» — проверьте, чтобы не заплатить за одни и те же дни дважды.')}</div>
          <ul className="text-xs mt-1.5 space-y-0.5">
            {rows.filter(r => r.overlapping_payouts?.length).map(r => (
              <li key={r.master.id}>{r.master.name}: {overlapText(r.overlapping_payouts)}</li>
            ))}
          </ul>
        </div>
      )}
      <Table
        rows={rows}
        rowKey={r => r.master.id}
        empty={t('Нет мастеров')}
        columns={[
          { key: 'name', label: t('Мастер'), render: r => r.master.name + (r.master.is_active ? '' : t(' (скрыт)')) },
          { key: 'scheme', label: t('Схема'), render: r => <button type="button" className="underline decoration-dotted text-gray-300" onClick={() => setModal({ type: 'scheme', row: r })}>{schemeText(r.scheme)}</button> },
          { key: 'visits', label: t('Визитов'), align: 'right' },
          { key: 'revenue', label: t('Выручка'), align: 'right', render: r => formatMoney(r.revenue) },
          { key: 'accrued', label: t('Начислено'), align: 'right', render: r => formatMoney(r.accrued) },
          { key: 'paid', label: t('Выплачено'), align: 'right', render: r => formatMoney(r.paid) },
          { key: 'due', label: t('К выплате'), align: 'right', render: r => <span style={{ color: Number(r.due) > 0 ? '#f472b6' : '#9ca3af' }}>{formatMoney(r.due)}</span> },
          { key: 'actions', label: '', align: 'right', render: r => <Button onClick={() => setModal({ type: 'payout', row: r })}>{t('Выплатить')}</Button> },
        ]}
      />

      {rows.some(r => r.payouts.length) && (
        <div className="mt-6">
          <h2 className="text-white text-base font-semibold mb-2">{t('Выплаты за период')}</h2>
          <Table
            rows={rows.flatMap(r => r.payouts.map(p => ({ ...p, master: r.master.name })))}
            columns={[
              { key: 'master', label: t('Мастер') },
              { key: 'period', label: t('За период'), render: p => `${formatShortDate(p.date_from)} — ${formatShortDate(p.date_to)}` },
              { key: 'amount', label: t('Сумма'), align: 'right', render: p => formatMoney(p.amount) },
              { key: 'actions', label: '', align: 'right', render: p => <button type="button" className="text-red-400 text-xs min-h-[32px]" onClick={() => undoPayout(p)}>{t('Отменить')}</button> },
            ]}
          />
        </div>
      )}

      {modal?.type === 'scheme' && <SchemeModal row={modal.row} onClose={() => setModal(null)} onSaved={closeAndReload} />}
      {modal?.type === 'payout' && <PayoutModal row={modal.row} range={range} onClose={() => setModal(null)} onSaved={closeAndReload} />}
    </div>
  )
}
