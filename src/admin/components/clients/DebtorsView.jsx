import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchDebtors } from '../../api/penalties'
import { PENALTY_KIND } from '../../utils/blacklist'
import { formatMoney } from '../../utils/money'
import { REBOOK_KEY } from '../../utils/rebook'
import { clientDate, formatShortDate } from '../../utils/time'
import ClientCardModal from './ClientCardModal'
import { ErrorText } from '../ui'
import Spinner from '../../../components/layout/Spinner'
import { t } from '../../../i18n'

function Total({ label, value, color }) {
  return (
    <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: 'var(--c-card)', border: '1px solid var(--c-line)' }}>
      <div className="text-gray-500 text-xs">{label}</div>
      <div className="text-lg font-bold" style={{ color: color || 'var(--c-ink)' }}>{value}</div>
    </div>
  )
}

function DebtorRow({ debtor, onOpen }) {
  const visit = debtor.next_visit
  return (
    <button
      type="button"
      onClick={() => onOpen(debtor.phone)}
      className="w-full text-left rounded-2xl px-4 py-3 transition-all active:scale-[0.99]"
      style={{ backgroundColor: 'var(--c-raised)', border: '1px solid var(--c-danger-line)' }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-ink text-sm font-semibold break-words">⛔ {debtor.name || t('Без имени')}</div>
          <div className="text-gray-400 text-xs">{debtor.phone}</div>
        </div>
        <div className="text-right">
          <div className="text-base font-bold" style={{ color: 'var(--c-danger)' }}>{formatMoney(debtor.debt)}</div>
          <div className="text-gray-500 text-[11px]">{t('долг')}</div>
        </div>
      </div>

      <div className="mt-2 text-xs">
        {visit ? (
          <span style={{ color: 'var(--c-ok)' }}>
            {t('Придёт')}{' '}{formatShortDate(visit.date)}, {visit.time}{visit.master ? ` · ${visit.master}` : ''}{' '}{t('— получить при визите')}
          </span>
        ) : (
          <span className="text-gray-400">{t('Записей нет — можно позвонить')}</span>
        )}
      </div>

      <ul className="mt-2 space-y-0.5">
        {debtor.penalties.map(p => (
          <li key={p.id} className="text-gray-400 text-xs break-words">
            {clientDate(p.date)}, {p.time} — {PENALTY_KIND[p.kind] || p.kind}
            {p.service ? ` · ${p.service}` : ''} · <span className="text-gray-300">{formatMoney(p.amount)}</span>
          </li>
        ))}
      </ul>
    </button>
  )
}

// Должники: у кого неоплаченные штрафы. Сверху — кто придёт скоро (при визите и получаем долг).
// Оплатить или простить штраф — в карточке клиента
// Вкладка «Должники» в разделе «Клиенты»
export default function DebtorsView() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [openPhone, setOpenPhone] = useState(null)

  const load = useCallback(() => {
    fetchDebtors().then(result => { setData(result); setError(null) }).catch(err => setError(err.message))
  }, [])

  useEffect(() => { load() }, [load])

  function closeCard() {
    setOpenPhone(null)
    load()  // штраф могли оплатить или простить
  }

  function rebook(card) {
    try {
      sessionStorage.setItem(REBOOK_KEY, JSON.stringify({ phone: card.phone, name: card.name }))
    } catch { /* без хранилища откроется пустая форма */ }
    navigate('/admin-panel')
  }

  return (
    <div>
      <p className="text-gray-500 text-sm mb-4">{t('Неоплаченные штрафы чёрного списка — получить при визите')}</p>
      <ErrorText>{error}</ErrorText>
      {!data && !error && <Spinner />}
      {data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
            <Total label={t('Общий долг')} value={formatMoney(data.total_debt)} color={Number(data.total_debt) ? 'var(--c-danger)' : undefined} />
            <Total label={t('Должников')} value={data.debtors} />
            <Total label={t('Оплачено штрафов в этом месяце')} value={formatMoney(data.paid_this_month)} color="var(--c-ok)" />
          </div>
          {data.results.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-10">{t('Должников нет')}</p>
          ) : (
            <div className="space-y-2">
              {data.results.map(d => <DebtorRow key={d.phone} debtor={d} onOpen={setOpenPhone} />)}
            </div>
          )}
          <p className="text-gray-500 text-xs mt-4">
            {t('Нажмите на клиента — откроется карточка: там штраф можно отметить оплаченным или простить. При оплате визита в журнале долг сам добавится к счёту.')}
          </p>
        </>
      )}
      {openPhone && <ClientCardModal phone={openPhone} onClose={closeCard} onRebook={rebook} onForgotten={closeCard} />}
    </div>
  )
}
