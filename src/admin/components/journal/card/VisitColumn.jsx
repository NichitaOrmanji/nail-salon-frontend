import { useEffect, useMemo, useState } from 'react'
import { Button, ErrorText, TextInput } from '../../ui'
import { addServiceToVisit } from '../../../api/appointments'
import { fetchStaffServices } from '../../../api/services'
import { notifyDataChanged } from '../../../utils/events'
import { formatMoney, methodLabel } from '../../../utils/money'
import { normalizeDecimal, todayString } from '../../../utils/time'
import { ACTIVE_STATUSES } from '../../../utils/statuses'
import { PENALTY_KIND, PENALTY_STATUS } from '../../../utils/blacklist'
import { formatDuration } from '../../../../utils/format'
import { t } from '../../../../i18n'
import { Section } from './ClientColumn'

// Статус записи — решение салона: ждёт подтверждения → подтверждена → пришёл / не пришёл
const STATUS_BUTTONS = [
  { key: 'pending', label: 'Ожидает', icon: '⏳', color: '#fbbf24' },
  { key: 'confirmed', label: 'Подтверждена', icon: '✓', color: '#34d399' },
  { key: 'completed', label: 'Пришёл', icon: '★', color: '#60a5fa' },
  { key: 'no_show', label: 'Не пришёл', icon: '✕', color: '#f87171' },
]

// Итог части визита: цена минус скидка в процентах
function partTotal(a) {
  const price = Number(a.service?.price) || 0
  const discount = Number(a.discount) || 0
  return Math.round(price * (100 - discount)) / 100
}

// Подсказка под статусами: что значит текущий статус и что делать дальше
function statusHint(a, paid) {
  const future = a.date > todayString()
  if (a.status === 'pending') return t('Онлайн-запись ждёт подтверждения салона. Если время подходит — нажмите «Подтверждена».')
  if (a.status === 'confirmed') {
    return future
      ? t('Запись подтверждена. В день визита отметьте «Пришёл» или «Не пришёл».')
      : t('Клиент пришёл? Отметьте «Пришёл» или «Не пришёл».')
  }
  if (a.status === 'completed') return paid ? t('Визит состоялся и оплачен.') : t('Визит состоялся. Не забудьте принять оплату ниже.')
  if (a.status === 'no_show') return t('Клиент не пришёл.')
  if (a.status === 'cancelled') return t('Запись отменена. Вернуть её можно кнопкой «Подтверждена».')
  return ''
}

// Статусы одной строкой: какой сейчас и куда можно переключить
export function StatusSection({ a, busy, paid, error, onStatus }) {
  const isActive = ACTIVE_STATUSES.includes(a.status)
  const canMark = isActive && a.date <= todayString()
  function allowed(key) {
    if (paid || key === a.status) return false
    if (key === 'pending') return a.status === 'confirmed'
    if (key === 'confirmed') return ['pending', 'cancelled', 'no_show', 'completed'].includes(a.status)
    return canMark
  }
  return (
    <Section title={t('Статус записи')}>
      {a.status === 'cancelled' && (
        <div className="rounded-xl px-3 py-2 mb-3 text-sm font-medium" style={{ backgroundColor: 'rgba(156,163,175,0.12)', color: '#d1d5db', border: '1px solid #4b5563' }}>
          {t('Запись отменена')}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-2" role="group" aria-label={t('Статус записи')}>
        {STATUS_BUTTONS.map(s => {
          const current = a.status === s.key
          const can = allowed(s.key)
          return (
            <button key={s.key} type="button" disabled={busy || !can} aria-pressed={current}
              onClick={() => onStatus(s.key)}
              className="min-h-[52px] px-2 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5 disabled:cursor-default"
              style={{
                backgroundColor: current ? `${s.color}26` : '#242424',
                color: current ? s.color : '#e5e7eb',
                border: `1px solid ${current ? s.color : '#2e2e2e'}`,
                opacity: !current && !can ? 0.4 : 1,
              }}>
              <span aria-hidden="true">{s.icon}</span>{t(s.label)}
            </button>
          )
        })}
      </div>
      <p className="text-gray-500 text-xs mt-3">{statusHint(a, paid)}</p>
      {error && <p role="alert" className="text-red-400 text-sm mt-2">{error}</p>}
    </Section>
  )
}

// Цена и скидка услуги: правит менеджер, пока визит не оплачен
function PriceEditor({ part, canEdit, busy, onPatch }) {
  const basePrice = String(Number(part.service?.price) || 0)
  const baseDiscount = String(Number(part.discount) || 0)
  const [price, setPrice] = useState(basePrice)
  const [discount, setDiscount] = useState(baseDiscount)
  const changed = price !== basePrice || discount !== baseDiscount
  const discountNum = Number(normalizeDecimal(discount))
  const invalid = !(Number(normalizeDecimal(price)) >= 0) || !(discountNum >= 0 && discountNum <= 100)

  if (!canEdit) {
    return (
      <div className="text-right">
        {Number(part.discount) > 0 && <div className="text-gray-500 text-xs line-through">{formatMoney(part.service?.price)}</div>}
        <div className="text-white text-sm font-semibold">{formatMoney(partTotal(part))}</div>
        {Number(part.discount) > 0 && <div className="text-xs" style={{ color: '#fbbf24' }}>−{Number(part.discount)}%</div>}
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-end gap-2 justify-end">
      <label className="w-24">
        <span className="block text-gray-500 text-xs mb-1">{t('Цена, L')}</span>
        <TextInput inputMode="decimal" value={price} onChange={e => setPrice(e.target.value)} aria-label={t('Цена, L')} />
      </label>
      <label className="w-20">
        <span className="block text-gray-500 text-xs mb-1">{t('Скидка, %')}</span>
        <TextInput inputMode="decimal" value={discount} onChange={e => setDiscount(e.target.value)} aria-label={t('Скидка, %')} aria-invalid={invalid} />
      </label>
      <div className="text-right min-w-[72px] pb-2.5">
        <div className="text-gray-500 text-xs">{t('Итого')}</div>
        <div className="text-white text-sm font-semibold">
          {formatMoney(Math.round((Number(normalizeDecimal(price)) || 0) * (100 - (discountNum || 0))) / 100)}
        </div>
      </div>
      {changed && (
        <Button variant="primary" disabled={busy || invalid}
          onClick={() => onPatch(part.id, { price: normalizeDecimal(price) || '0', discount: normalizeDecimal(discount) || '0' })}>
          {t('Сохранить')}
        </Button>
      )}
    </div>
  )
}

function Part({ part, main, isManager, isOwner, busy, onPatch, onPay, onRemovePayment }) {
  const paid = !!part.payment
  const active = ACTIVE_STATUSES.includes(part.status) || part.status === 'completed'
  const canPay = isManager && !paid && active && part.date <= todayString()
  return (
    <li className="rounded-xl p-3" style={{ backgroundColor: '#242424', border: main ? '1px solid #db2777' : '1px solid #2e2e2e' }}>
      <div className="flex flex-wrap gap-3 justify-between">
        <div className="min-w-0">
          <div className="text-white text-sm font-semibold">
            {part.service ? part.service.name : t('Не указана')}
            {part.service && part.service.is_active === false && <span className="text-gray-500 font-normal">{' '}{t('(скрыта)')}</span>}
          </div>
          <div className="text-gray-500 text-xs">
            {part.start_time}–{part.end_time} · {formatDuration(part.duration)}
            {!main && part.master && ` · ${part.master.name}`}
          </div>
          {part.status === 'cancelled' && <div className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{t('Отменена')}</div>}
        </div>
        {part.service && (
          <PriceEditor key={`${part.service.price}-${part.discount}`} part={part} busy={busy} onPatch={onPatch}
            canEdit={isManager && !paid && part.status !== 'cancelled'} />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-2">
        {paid ? (
          <span className="text-sm" style={{ color: '#34d399' }}>
            {t('Оплачено')}: {formatMoney(part.payment.amount)} · {methodLabel(part.payment.method)}
            {Number(part.payment.discount) > 0 && <span className="text-gray-500">{' '}{t('(скидка')}{' '}{formatMoney(part.payment.discount)})</span>}
          </span>
        ) : part.status !== 'cancelled' && <span className="text-gray-500 text-sm">{t('не оплачено')}</span>}
        {part.penalty && (
          <span className="text-sm" style={{ color: PENALTY_STATUS[part.penalty.status]?.color }}>
            {t('Штраф')}: {formatMoney(part.penalty.amount)} · {PENALTY_KIND[part.penalty.kind]} · {PENALTY_STATUS[part.penalty.status]?.label}
          </span>
        )}
        <span className="flex-1" />
        {canPay && <Button variant="primary" disabled={busy} onClick={() => onPay(part)}>{t('Оплатить')}</Button>}
        {paid && isOwner && <Button disabled={busy} onClick={() => onRemovePayment(part)}>{t('Отменить оплату')}</Button>}
        {!main && isManager && !paid && ACTIVE_STATUSES.includes(part.status) && (
          <Button variant="danger" disabled={busy}
            onClick={() => onPatch(part.id, { status: 'cancelled' }, t('Убрать услугу «{name}» из визита?', { name: part.service?.name || '' }))}>
            {t('Убрать')}
          </Button>
        )}
      </div>
    </li>
  )
}

// Поиск услуги мастера и добавление в визит (встаёт сразу после последней)
function AddService({ a, master, onDone }) {
  const [open, setOpen] = useState(false)
  const [services, setServices] = useState(null)
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open || services) return
    fetchStaffServices().then(setServices).catch(err => setError(err.message))
  }, [open, services])

  const list = useMemo(() => {
    if (!services) return []
    const allowed = master?.services ? new Set(master.services) : null
    const q = query.trim().toLowerCase()
    return services
      .filter(s => s.is_active !== false && (!allowed || allowed.has(s.id)))
      .filter(s => !q || s.name.toLowerCase().includes(q) || (s.category_name || '').toLowerCase().includes(q))
  }, [services, master, query])

  async function add(service) {
    setSaving(true)
    setError(null)
    try {
      await addServiceToVisit(a.id, { service: service.id })
      notifyDataChanged()
      setOpen(false)
      setQuery('')
      onDone?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return <Button onClick={() => setOpen(true)}>{t('+ Услуга')}</Button>
  return (
    <div className="w-full rounded-xl p-3 space-y-2" style={{ backgroundColor: '#242424', border: '1px solid #2e2e2e' }}>
      <div className="flex gap-2">
        <TextInput autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder={t('Поиск по услугам')} aria-label={t('Поиск по услугам')} />
        <Button onClick={() => setOpen(false)}>{t('Закрыть')}</Button>
      </div>
      {error && <ErrorText>{error}</ErrorText>}
      {!services && !error && <p className="text-gray-500 text-sm">{t('Загрузка...')}</p>}
      {services && list.length === 0 && <p className="text-gray-500 text-sm">{t('Ничего не найдено')}</p>}
      <ul className="max-h-64 overflow-y-auto divide-y divide-[#2e2e2e]">
        {list.map(s => (
          <li key={s.id}>
            <button type="button" disabled={saving} onClick={() => add(s)}
              className="w-full min-h-[44px] flex justify-between gap-3 items-center text-left py-2 disabled:opacity-50">
              <span className="min-w-0">
                <span className="block text-white text-sm truncate">{s.name}</span>
                <span className="block text-gray-500 text-xs">{s.category_name ? `${s.category_name} · ` : ''}{formatDuration(s.duration)}</span>
              </span>
              <span className="text-gray-300 text-sm whitespace-nowrap">{formatMoney(s.price)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Услуги визита с ценой и скидкой, оплата, «К оплате»
export function ServicesSection({ a, parts, master, isManager, isOwner, busy, onPatch, onPay, onRemovePayment }) {
  const toPay = parts
    .filter(p => !p.payment && p.status !== 'cancelled' && p.status !== 'no_show')
    .reduce((sum, p) => sum + partTotal(p), 0)
  const canAdd = isManager && ACTIVE_STATUSES.includes(a.status) && !!a.master

  return (
    <Section title={t('Услуги и оплата')}>
      <ul className="space-y-2">
        {parts.map(p => (
          <Part key={p.id} part={p} main={p.id === a.id} isManager={isManager} isOwner={isOwner} busy={busy}
            onPatch={onPatch} onPay={onPay} onRemovePayment={onRemovePayment} />
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid #2e2e2e' }}>
        {canAdd && <AddService a={a} master={master} />}
        <div className="ml-auto text-right">
          <div className="text-gray-500 text-xs">{t('К оплате')}</div>
          <div className="text-white text-xl font-semibold">{formatMoney(toPay)}</div>
        </div>
      </div>
    </Section>
  )
}
