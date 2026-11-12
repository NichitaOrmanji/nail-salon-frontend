import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button, Checkbox, ErrorText, TextArea, TextInput } from '../../ui'
import { fetchClientCard, saveClientNote } from '../../../api/clients'
import { updateAppointment } from '../../../api/appointments'
import { notifyDataChanged } from '../../../utils/events'
import { formatMoney } from '../../../utils/money'
import { formatShortDate } from '../../../utils/time'
import { t } from '../../../../i18n'

export function Section({ title, children, className = '' }) {
  return (
    <section className={`rounded-2xl p-4 ${className}`} style={{ backgroundColor: '#1f1f1f', border: '1px solid #2e2e2e' }}>
      {title && <h3 className="text-white text-sm font-semibold mb-3">{title}</h3>}
      {children}
    </section>
  )
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-gray-500 text-xs">{label}</div>
      <div className="text-white text-sm font-medium">{value}</div>
    </div>
  )
}

// Мессенджеры по номеру клиента: открываются в приложении на телефоне или в браузере
function Messengers({ phone }) {
  const digits = (phone || '').replace(/\D/g, '')
  if (!digits) return null
  const links = [
    { label: 'WhatsApp', href: `https://wa.me/${digits}`, color: '#25d366' },
    { label: 'Viber', href: `viber://chat?number=%2B${digits}`, color: '#a78bfa' },
    { label: 'Telegram', href: `https://t.me/+${digits}`, color: '#38bdf8' },
  ]
  return (
    <div>
      <div className="text-gray-500 text-xs mb-1.5">{t('Написать:')}</div>
      <div className="flex flex-wrap gap-2">
        {links.map(l => (
          <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
            className="min-h-[40px] px-3 rounded-xl inline-flex items-center text-sm font-medium"
            style={{ backgroundColor: '#242424', color: l.color, border: '1px solid #2e2e2e' }}>
            {l.label}
          </a>
        ))}
      </div>
    </div>
  )
}

// «Записывает другого посетителя»: кто звонил (клиент записи — тот, кто придёт)
function Booker({ a, canEdit }) {
  const [on, setOn] = useState(!!(a.booker_name || a.booker_phone))
  const [name, setName] = useState(a.booker_name || '')
  const [phone, setPhone] = useState(a.booker_phone || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const changed = name !== (a.booker_name || '') || phone !== (a.booker_phone || '')

  async function save(data) {
    setSaving(true)
    setError(null)
    try {
      await updateAppointment(a.id, data)
      notifyDataChanged()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function toggle(value) {
    setOn(value)
    if (!value && (a.booker_name || a.booker_phone)) {
      setName('')
      setPhone('')
      save({ booker_name: '', booker_phone: '' })
    }
  }

  if (!canEdit && !on) return null
  return (
    <div>
      <Checkbox checked={on} onChange={toggle} disabled={!canEdit || saving} label={t('Записывает другого посетителя')} />
      {on && (
        <div className="space-y-2 mt-1">
          <TextInput value={name} onChange={e => setName(e.target.value)} placeholder={t('Кто записывал: имя')}
            aria-label={t('Кто записывал: имя')} disabled={!canEdit} />
          <TextInput value={phone} onChange={e => setPhone(e.target.value)} placeholder={t('Телефон записавшего')}
            aria-label={t('Телефон записавшего')} inputMode="tel" disabled={!canEdit} />
          {error && <ErrorText>{error}</ErrorText>}
          {canEdit && changed && (
            <div className="flex justify-end">
              <Button variant="primary" disabled={saving} onClick={() => save({ booker_name: name.trim(), booker_phone: phone.trim() })}>{t('Сохранить')}</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Заметка о клиенте (общая для всех его записей, видят только сотрудники)
function ClientNote({ phone, initial }) {
  const [text, setText] = useState(initial || '')
  const [base, setBase] = useState(initial || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      await saveClientNote(phone, text)
      setBase(text)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="text-gray-500 text-xs mb-1.5">{t('Примечание о клиенте')}</div>
      <TextArea rows={2} value={text} onChange={e => setText(e.target.value)} placeholder={t('Аллергии, предпочтения, любимый дизайн...')}
        aria-label={t('Примечание о клиенте')} />
      {error && <ErrorText>{error}</ErrorText>}
      {text !== base && (
        <div className="flex justify-end gap-2 mt-2">
          <Button onClick={() => setText(base)} disabled={saving}>{t('Отменить')}</Button>
          <Button variant="primary" onClick={save} disabled={saving}>{t('Сохранить')}</Button>
        </div>
      )}
    </div>
  )
}

// Клиент: контакты, связь, метка, чёрный список, примечание; статистика визитов
export default function ClientColumn({ a, isManager, canEdit, onNavigateAway }) {
  const location = useLocation()
  const [card, setCard] = useState(null)
  const phone = a.client_phone

  useEffect(() => {
    if (!isManager || !phone) return
    let alive = true
    fetchClientCard(phone).then(data => { if (alive) setCard(data) }).catch(() => { if (alive) setCard(false) })
    return () => { alive = false }
  }, [isManager, phone, a.id])

  const isNew = card && card.total <= 1

  return (
    <>
      <Section title={t('Клиент')}>
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
            style={{ backgroundColor: '#2e1f28', color: '#f472b6' }}>
            {(a.client_name || '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="text-white font-semibold truncate">{a.client_name || t('Без имени')}</div>
            {phone ? <a href={`tel:${phone}`} className="text-sm" style={{ color: '#f472b6' }}>{phone}</a> : <span className="text-gray-500 text-sm">—</span>}
            {a.client_email && <div className="text-gray-400 text-xs truncate">{a.client_email}</div>}
          </div>
        </div>
        <div className="mt-3 space-y-3">
          <Messengers phone={phone} />
          {card && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="rounded-lg px-2 py-1 text-xs font-medium"
                style={isNew ? { backgroundColor: 'rgba(96,165,250,0.15)', color: '#93c5fd' } : { backgroundColor: 'rgba(52,211,153,0.15)', color: '#6ee7b7' }}>
                {isNew ? t('Новый клиент') : t('Постоянный клиент')}
              </span>
              {isManager && (
                <Link to="/admin-panel/clients" state={{ phone, back: location.pathname + location.search }} onClick={onNavigateAway} className="text-xs text-gray-400 underline">
                  {t('Профиль клиента')}
                </Link>
              )}
            </div>
          )}
          {a.blacklist && (
            <div className="rounded-xl px-3 py-2 text-sm" role="alert"
              style={{ backgroundColor: 'rgba(248, 113, 113, 0.12)', border: '1px solid #f87171', color: '#fca5a5' }}>
              <div className="font-semibold" style={{ color: '#f87171' }}>{t('⛔ Клиент в чёрном списке')}</div>
              {Number(a.blacklist.debt) > 0
                ? <div>{t('Долг')}{' '}{formatMoney(a.blacklist.debt)}{' '}{t('— получить при оплате этого визита')}</div>
                : <div>{t('Долгов нет, нарушений: {count}', { count: a.blacklist.count })}</div>}
            </div>
          )}
          <Booker key={`${a.id}-${a.booker_name}-${a.booker_phone}`} a={a} canEdit={canEdit} />
          {isManager && card && <ClientNote key={phone} phone={phone} initial={card.note} />}
        </div>
      </Section>

      {isManager && card && (
        <Section title={t('Визиты клиента')}>
          <div className="grid grid-cols-2 gap-3">
            <Stat label={t('Последний визит')} value={card.last_visit ? formatShortDate(card.last_visit) : '—'} />
            <Stat label={t('Всего визитов')} value={card.visits} />
            <Stat label={t('Оплачено')} value={formatMoney(card.paid)} />
            <Stat label={t('Не пришёл')} value={card.no_shows} />
            {card.top_master && <Stat label={t('Любимый мастер')} value={card.top_master} />}
            {card.average_check && <Stat label={t('Средний чек')} value={formatMoney(card.average_check)} />}
          </div>
        </Section>
      )}

    </>
  )
}
