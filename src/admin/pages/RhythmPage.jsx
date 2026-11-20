import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchRhythm, markInvited } from '../api/rhythm'
import { useStaffAuth } from '../context/StaffAuthContext'
import { ErrorText, PageHeader } from '../components/ui'
import { formatMoney } from '../utils/money'
import { formatShortDate } from '../utils/time'
import { REBOOK_KEY } from '../utils/rebook'
import Spinner from '../../components/layout/Spinner'
import { t, tr } from '../../i18n'

const TABS = tr([
  { key: 'soon', label: 'Пора', hint: 'Срок визита в ближайшую неделю или недавно прошёл, а записи нет.' },
  { key: 'leaving', label: 'Уходят', hint: 'Не приходили в полтора раза дольше обычного. Их ещё можно вернуть — сверху те, кто приносил больше.' },
  { key: 'lost', label: 'Потеряны', hint: 'Не приходили в три раза дольше обычного. Можно напомнить о себе.' },
])

const CHANNEL_LABELS = tr({
  telegram: 'в Telegram',
  email: 'по email',
  whatsapp: 'в WhatsApp',
  viber: 'в Viber',
  phone: 'звонком',
})

const rowStyle = { backgroundColor: 'var(--c-surface)', border: '1px solid var(--c-line)' }
const actionClass = 'min-h-[40px] px-3 rounded-xl text-sm font-medium inline-flex items-center justify-center'
const actionStyle = { border: '1px solid var(--c-line)', color: 'var(--c-ink)' }

// 21 → «каждые ~3 нед.»
function intervalText(days) {
  if (days < 14) return t('каждые {n} дн.', { n: days })
  if (days < 60) return t('каждые ~{n} нед.', { n: Math.round(days / 7) })
  return t('каждые ~{n} мес.', { n: Math.round(days / 30) })
}

function dueText(row) {
  if (row.stage !== 'soon') {
    return t('не приходит уже {n} дн.', { n: row.interval - row.days_left })
  }
  if (row.days_left > 0) return t('срок через {n} дн.', { n: row.days_left })
  if (row.days_left === 0) return t('срок сегодня')
  return t('срок прошёл {n} дн. назад', { n: -row.days_left })
}

const digits = phone => (phone || '').replace(/\D/g, '')

function whatsappUrl(row) {
  return `https://wa.me/${digits(row.phone)}?text=${encodeURIComponent(row.text)}`
}

// Viber не умеет открывать чат с готовым текстом: копируем текст, затем открываем чат с клиентом
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

function RhythmRow({ row, onMarked, onBook, setNotice }) {
  const [busy, setBusy] = useState(false)

  async function mark(channel) {
    setBusy(true)
    try {
      onMarked(row, await markInvited({ phone: row.phone, group: row.group, channel }))
    } catch (err) {
      setNotice(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function viber() {
    const copied = await copyText(row.text)
    setNotice(copied ? t('Текст скопирован — вставьте его в чат Viber') : t('Не удалось скопировать текст'))
    mark('viber')
    window.location.href = `viber://chat?number=%2B${digits(row.phone)}`
  }

  const message = row.message
  return (
    <li className="rounded-2xl p-4" style={rowStyle}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-ink font-semibold">{row.name || t('Без имени')}</span>
        <a href={`tel:${row.phone}`} className="text-sm" style={{ color: 'var(--accent-ink)' }}>{row.phone}</a>
      </div>
      <div className="text-sm text-gray-500 mt-1">
        {[row.category !== row.service ? row.category : null, row.service, row.master?.name].filter(Boolean).join(' · ')}
      </div>
      <div className="text-sm mt-1" style={{ color: 'var(--c-ink)' }}>
        {t('Был(а) {date}', { date: formatShortDate(row.last_visit) })} · {intervalText(row.interval)}
        {!row.own_interval && <span className="text-gray-500"> {t('(по услуге)')}</span>}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mt-1">
        <span className="font-medium" style={{ color: row.stage === 'soon' ? 'var(--c-ok)' : 'var(--c-warn-2)' }}>{dueText(row)}</span>
        {row.average_check && <span className="text-gray-500">{t('Средний чек {sum}', { sum: formatMoney(row.average_check) })}</span>}
        {message && (
          <span className="text-gray-500">
            {t('Позвали {channel} {date}', { channel: CHANNEL_LABELS[message.channel] || '', date: formatShortDate(message.sent_at.slice(0, 10)) })}
          </span>
        )}
      </div>
      {row.opted_out ? (
        <p className="text-xs mt-3" style={{ color: 'var(--c-muted)' }}>{t('Клиент попросил не присылать такие сообщения')}</p>
      ) : (
        <div className="flex flex-wrap gap-2 mt-3">
          <a href={whatsappUrl(row)} target="_blank" rel="noopener noreferrer" className={actionClass} style={actionStyle}
            onClick={() => mark('whatsapp')} aria-disabled={busy}>
            WhatsApp
          </a>
          <button type="button" className={actionClass} style={actionStyle} onClick={viber} disabled={busy}>Viber</button>
          <a href={`tel:${row.phone}`} className={actionClass} style={actionStyle} onClick={() => mark('phone')}>{t('Позвонить')}</a>
          <button type="button" className={actionClass} style={{ backgroundColor: 'var(--accent)', color: '#fff' }} onClick={() => onBook(row)}>
            {t('Записать')}
          </button>
        </div>
      )}
    </li>
  )
}

// «Пора записаться»: кому пора снова на услугу (по тому, как часто клиент ходит) и кто перестал ходить
export default function RhythmPage() {
  const { me, isManager } = useStaffAuth()
  const navigate = useNavigate()
  const [stage, setStage] = useState('soon')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchRhythm(stage)
      .then(result => { if (!cancelled) { setData(result); setError(null) } })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [stage])

  function marked(row, message) {
    setData(prev => prev && ({
      ...prev,
      stats: { ...prev.stats, invited: prev.stats.invited + (row.message ? 0 : 1) },
      results: prev.results.map(r => (r.phone === row.phone && r.group === row.group ? { ...r, message } : r)),
    }))
  }

  function book(row) {
    try {
      sessionStorage.setItem(REBOOK_KEY, JSON.stringify({ phone: row.phone, name: row.name }))
    } catch { /* без хранилища откроется пустая форма */ }
    navigate('/admin-panel')
  }

  const tab = TABS.find(item => item.key === stage)
  const stats = data?.stats
  return (
    <div className="px-4 md:px-6 py-5 max-w-3xl">
      <PageHeader title={t('Пора записаться')} subtitle={t('Кому пора снова прийти — по тому, как часто клиент обычно ходит')} />
      {data && !data.enabled && (
        <p className="text-sm rounded-xl px-3 py-2 mb-4" style={{ backgroundColor: 'var(--c-card)', color: 'var(--c-muted)' }}>
          {me?.role === 'owner'
            ? t('Раздел выключен и не виден сотрудникам. Включить: «Настройки» → «Правила записи» → «Ритм клиента».')
            : t('Раздел выключен владельцем салона.')}
        </p>
      )}
      {stats && stats.invited > 0 && (
        <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: 'var(--accent-soft)' }}>
          <div className="text-ink text-sm font-semibold">
            {t('В этом месяце позвали {invited}, вернулись {returned}', { invited: stats.invited, returned: stats.returned })}
          </div>
          {stats.returned > 0 && (
            <div className="text-sm mt-0.5" style={{ color: 'var(--c-ok)' }}>{t('Записи на {sum}', { sum: formatMoney(stats.revenue) })}</div>
          )}
        </div>
      )}
      <div role="tablist" className="flex gap-2 mb-2">
        {TABS.map(item => {
          const active = item.key === stage
          const count = data?.counts?.[item.key]
          return (
            <button key={item.key} type="button" role="tab" aria-selected={active} onClick={() => setStage(item.key)}
              className="min-h-[40px] px-4 rounded-xl text-sm font-medium"
              style={active ? { backgroundColor: 'var(--accent)', color: '#fff' } : { border: '1px solid var(--c-line)', color: 'var(--c-ink)' }}>
              {item.label}{count !== undefined ? ` · ${count}` : ''}
            </button>
          )
        })}
      </div>
      <p className="text-gray-500 text-xs mb-4">{tab.hint}</p>
      <ErrorText className="mb-3">{error}</ErrorText>
      {notice && (
        <p role="status" className="text-sm rounded-xl px-3 py-2 mb-3" style={{ backgroundColor: 'var(--c-card)', color: 'var(--c-ink)' }}>{notice}</p>
      )}
      {!data && !error && <Spinner />}
      {data && data.results.length === 0 && (
        <div className="rounded-2xl p-5 text-sm text-gray-500" style={rowStyle}>
          <p>{t('Сейчас здесь никого.')}</p>
          <p className="mt-2">
            {t('Ритм клиента появляется после второго визита на услугу. Чтобы считать и после первого, укажите у услуги «Обычно повторяют через, дней».')}
            {isManager && ` ${t('Это делается в разделе «Услуги».')}`}
          </p>
        </div>
      )}
      {data && data.results.length > 0 && (
        <ul className="space-y-3">
          {data.results.map(row => (
            <RhythmRow key={`${row.phone}-${row.group}`} row={row} onMarked={marked} onBook={book} setNotice={setNotice} />
          ))}
        </ul>
      )}
    </div>
  )
}
