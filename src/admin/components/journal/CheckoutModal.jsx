import { useState } from 'react'
import Modal from '../Modal'
import { Button, Checkbox, ErrorText, Field, TextInput } from '../ui'
import { checkoutAppointment } from '../../api/finance'
import { METHODS, formatMoney } from '../../utils/money'
import { normalizeDecimal } from '../../utils/time'

// Оплата визита: цена услуги, скидка (в леях или %), способ оплаты. Визит отмечается «Пришёл»
export default function CheckoutModal({ appointment: a, onClose, onPaid }) {
  const price = Number(a.service?.price) || 0
  const [method, setMethod] = useState('cash')
  const [discountText, setDiscountText] = useState('')
  const [percent, setPercent] = useState(false)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  // Чёрный список: долг за прошлые неявки оплачивается при этом визите
  const debt = Number(a.blacklist?.debt) || 0
  const [payDebt, setPayDebt] = useState(debt > 0)

  const raw = Number(normalizeDecimal(discountText)) || 0
  const discount = Math.round((percent ? price * raw / 100 : raw) * 100) / 100
  const invalid = raw < 0 || discount > price || (percent && raw > 100)
  const totalAmount = Math.max(0, price - discount) + (payDebt ? debt : 0)

  async function handleSubmit(e) {
    e.preventDefault()
    if (invalid || saving) return
    setError(null)
    setSaving(true)
    try {
      await checkoutAppointment(a.id, { method, discount: discount.toFixed(2), pay_penalties: payDebt })
      onPaid()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <Modal title="Оплата визита" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-sm text-gray-400">
          {a.client_name} · {a.service ? a.service.name : 'Без услуги'}
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Цена</span>
          <span className="text-white">{formatMoney(price)}</span>
        </div>
        <Field label={percent ? 'Скидка, %' : 'Скидка, L'}>
          <div className="flex gap-2">
            <TextInput
              inputMode="decimal"
              value={discountText}
              onChange={e => setDiscountText(e.target.value)}
              placeholder="0"
              aria-invalid={invalid}
            />
            <Button onClick={() => setPercent(p => !p)} aria-label="Скидка в процентах или в леях">
              {percent ? '%' : 'L'}
            </Button>
          </div>
        </Field>
        {invalid && <ErrorText>Скидка не может быть больше цены</ErrorText>}
        <div>
          <span className="block text-gray-400 text-xs font-medium mb-1.5">Способ оплаты</span>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Способ оплаты">
            {METHODS.map(m => (
              <button
                key={m.key}
                type="button"
                aria-pressed={method === m.key}
                onClick={() => setMethod(m.key)}
                className="min-h-[44px] rounded-xl text-sm font-medium"
                style={{
                  backgroundColor: method === m.key ? '#f472b6' : '#242424',
                  color: method === m.key ? '#ffffff' : '#d1d5db',
                  border: '1px solid #2e2e2e',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        {debt > 0 && (
          <div className="rounded-xl px-3 py-2" style={{ backgroundColor: 'rgba(248, 113, 113, 0.12)', border: '1px solid #f87171' }}>
            <Checkbox
              checked={payDebt}
              onChange={setPayDebt}
              label={<span style={{ color: '#fca5a5' }}>Штраф из чёрного списка: {formatMoney(debt)}</span>}
            />
            <p className="text-xs text-gray-400 mt-1">Клиент не пришёл или поздно отменил прошлую запись — штраф оплачивается сейчас.</p>
          </div>
        )}
        <div className="flex justify-between items-baseline pt-2" style={{ borderTop: '1px solid #2e2e2e' }}>
          <span className="text-gray-400 text-sm">К оплате</span>
          <span className="text-white text-2xl font-bold">{formatMoney(totalAmount)}</span>
        </div>
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Отмена</Button>
          <Button type="submit" variant="primary" disabled={invalid || saving}>
            {saving ? 'Сохраняем...' : 'Оплачено'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
