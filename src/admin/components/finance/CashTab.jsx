import { useCallback, useEffect, useState } from 'react'
import { createOperation, deleteOperation, fetchCashDay, fetchOperations } from '../../api/finance'
import { formatMoney, methodLabel, METHODS } from '../../utils/money'
import { addDays, formatDayTitle, normalizeDecimal, todayString } from '../../utils/time'
import { Button, ErrorText, Field, Select, TextInput } from '../ui'
import Modal from '../Modal'
import Stat, { Section, Table } from './Stat'
import Spinner from '../../../components/layout/Spinner'

function OperationModal({ date, categories, onClose, onSaved }) {
  const [kind, setKind] = useState('expense')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [category, setCategory] = useState('')
  const [comment, setComment] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const options = kind === 'expense' ? categories.expense : categories.income

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await createOperation({ date, kind, amount: normalizeDecimal(amount), method, category: category.trim(), comment: comment.trim() })
      onSaved()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <Modal title="Операция по кассе" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Тип операции">
          {[['expense', 'Расход'], ['income', 'Приход']].map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={kind === key}
              onClick={() => { setKind(key); setCategory('') }}
              className="min-h-[44px] rounded-xl text-sm font-medium"
              style={{ backgroundColor: kind === key ? (key === 'expense' ? '#f87171' : '#34d399') : '#242424', color: kind === key ? '#111111' : '#d1d5db' }}
            >
              {label}
            </button>
          ))}
        </div>
        <Field label="Сумма, L">
          <TextInput inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" required />
        </Field>
        <Field label="Категория">
          <TextInput list="cash-categories" value={category} onChange={e => setCategory(e.target.value)} placeholder="Выберите или впишите" required />
          <datalist id="cash-categories">
            {options.map(c => <option key={c} value={c} />)}
          </datalist>
        </Field>
        <Field label="Способ">
          <Select value={method} onChange={e => setMethod(e.target.value)}>
            {METHODS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
          </Select>
        </Field>
        <Field label="Комментарий">
          <TextInput value={comment} onChange={e => setComment(e.target.value)} />
        </Field>
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="primary" disabled={saving || !amount || !category.trim()}>
            {saving ? 'Сохраняем...' : 'Сохранить'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// Касса за день: остаток на начало, приход, расход, остаток на конец (наличные);
// оплаты визитов и операции дня
export default function CashTab() {
  const [date, setDate] = useState(todayString)
  const [data, setData] = useState(null)
  const [categories, setCategories] = useState({ income: [], expense: [] })
  const [error, setError] = useState(null)
  const [adding, setAdding] = useState(false)

  const load = useCallback(() => (
    fetchCashDay(date)
      .then(result => { setData(result); setError(null) })
      .catch(err => setError(err.message))
  ), [date])

  useEffect(() => {
    let cancelled = false
    fetchCashDay(date)
      .then(result => { if (!cancelled) { setData(result); setError(null) } })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [date])

  useEffect(() => {
    fetchOperations({ dateFrom: todayString(), dateTo: todayString() })
      .then(result => setCategories({ income: result.income_categories || [], expense: result.expense_categories || [] }))
      .catch(() => {})
  }, [])

  async function remove(op) {
    if (!window.confirm(`Удалить операцию «${op.category}» на ${formatMoney(op.amount)}?`)) return
    try {
      await deleteOperation(op.id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Button aria-label="Предыдущий день" className="w-11 px-0" onClick={() => setDate(d => addDays(d, -1))}>‹</Button>
        <Button onClick={() => setDate(todayString())}>Сегодня</Button>
        <Button aria-label="Следующий день" className="w-11 px-0" onClick={() => setDate(d => addDays(d, 1))}>›</Button>
        <input
          type="date"
          aria-label="Дата"
          value={date}
          onChange={e => e.target.value && setDate(e.target.value)}
          className="min-h-[44px] px-3 rounded-xl text-white text-sm outline-none"
          style={{ backgroundColor: '#242424', border: '1px solid #2e2e2e', colorScheme: 'dark' }}
        />
        <span className="text-white font-semibold ml-1">{formatDayTitle(date)}</span>
        <Button variant="primary" className="ml-auto" onClick={() => setAdding(true)}>+ Приход / расход</Button>
      </div>

      <ErrorText className="mt-3">{error}</ErrorText>
      {!data && !error && <Spinner />}
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <Stat label="Наличные на начало дня" value={formatMoney(data.opening)} />
            <Stat label="Приход наличными" value={formatMoney(data.cash_in)} color="#34d399" />
            <Stat label="Расход наличными" value={formatMoney(data.cash_out)} color="#f87171" />
            <Stat label="Наличные на конец дня" value={formatMoney(data.closing)} color="#f472b6" />
          </div>
          <p className="text-gray-500 text-xs mt-2">
            Оплаты за день: {METHODS.map(m => `${m.label.toLowerCase()} ${formatMoney(data.by_method[m.key])}`).join(' · ')}
          </p>

          <Section title="Оплаты визитов">
            <Table
              rows={data.payments}
              empty="За этот день оплат нет"
              columns={[
                { key: 'time', label: 'Время' },
                { key: 'client_name', label: 'Клиент' },
                { key: 'master', label: 'Мастер', render: r => r.master || '—' },
                { key: 'method', label: 'Способ', render: r => methodLabel(r.method) },
                { key: 'discount', label: 'Скидка', align: 'right', render: r => (Number(r.discount) ? formatMoney(r.discount) : '—') },
                { key: 'amount', label: 'Сумма', align: 'right', render: r => formatMoney(r.amount) },
              ]}
            />
          </Section>

          <Section title="Приходы и расходы">
            <Table
              rows={data.operations}
              empty="Операций нет"
              columns={[
                { key: 'kind', label: '', render: r => <span style={{ color: r.kind === 'income' ? '#34d399' : '#f87171' }}>{r.kind === 'income' ? 'Приход' : 'Расход'}</span> },
                { key: 'category', label: 'Категория' },
                { key: 'comment', label: 'Комментарий', render: r => r.comment || '—' },
                { key: 'method', label: 'Способ', render: r => methodLabel(r.method) },
                { key: 'amount', label: 'Сумма', align: 'right', render: r => formatMoney(r.amount) },
                {
                  key: 'actions', label: '', align: 'right',
                  render: r => (r.salary_payout
                    ? <span className="text-gray-500 text-xs">в «Зарплатах»</span>
                    : <button type="button" className="text-red-400 text-xs min-h-[32px]" onClick={() => remove(r)}>Удалить</button>),
                },
              ]}
            />
          </Section>
        </>
      )}

      {adding && (
        <OperationModal
          date={date}
          categories={categories}
          onClose={() => setAdding(false)}
          onSaved={() => { setAdding(false); load() }}
        />
      )}
    </div>
  )
}
