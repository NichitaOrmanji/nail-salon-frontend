import { useEffect, useState } from 'react'
import { fetchReviews } from '../api/reviews'
import { useStaffAuth } from '../context/StaffAuthContext'
import { ErrorText, PageHeader } from '../components/ui'
import { formatShortDate } from '../utils/time'
import Spinner from '../../components/layout/Spinner'
import { t, tr } from '../../i18n'

const FILTERS = tr([
  { key: 'all', label: 'Все' },
  { key: 'low', label: 'Низкие (1–3)' },
])

const cardStyle = { backgroundColor: 'var(--c-surface)', border: '1px solid var(--c-line)' }

function Stars({ rating }) {
  return (
    <span aria-label={t('{n} из 5', { n: rating })} style={{ color: 'var(--c-warn-2)', letterSpacing: '1px' }}>
      {'★'.repeat(rating)}<span style={{ color: 'var(--c-line-2)' }}>{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

function ReviewRow({ review }) {
  const low = review.rating <= 3
  return (
    <li className="rounded-2xl p-4" style={{ ...cardStyle, ...(low ? { borderColor: 'var(--c-warn-2)' } : {}) }}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-lg"><Stars rating={review.rating} /></span>
        <span className="text-xs text-gray-500">{formatShortDate(review.date)} · {review.time}</span>
      </div>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
        <span className="text-ink font-semibold">{review.client_name || t('Без имени')}</span>
        <a href={`tel:${review.phone}`} className="text-sm" style={{ color: 'var(--accent-ink)' }}>{review.phone}</a>
      </div>
      <div className="text-sm text-gray-500 mt-0.5">{[review.service, review.master?.name].filter(Boolean).join(' · ')}</div>
      {review.comment && (
        <p className="text-sm mt-2 whitespace-pre-line" style={{ color: 'var(--c-ink)' }}>«{review.comment}»</p>
      )}
      {review.publish && <p className="text-xs mt-2" style={{ color: 'var(--c-ok)' }}>{t('Клиент разрешил показать отзыв на сайте')}</p>}
    </li>
  )
}

// «Отзывы»: оценки клиентов после визита, средняя по салону и мастерам, низкие — отдельным фильтром
export default function ReviewsPage() {
  const { me } = useStaffAuth()
  const [filter, setFilter] = useState('all')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchReviews({ low: filter === 'low' })
      .then(result => { if (!cancelled) { setData(result); setError(null) } })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [filter])

  const summary = data?.summary
  return (
    <div className="px-4 md:px-6 py-5 max-w-3xl">
      <PageHeader title={t('Отзывы')} subtitle={t('Оценки клиентов после визита')} />
      {data && !data.enabled && (
        <p className="text-sm rounded-xl px-3 py-2 mb-4" style={{ backgroundColor: 'var(--c-card)', color: 'var(--c-muted)' }}>
          {me?.role === 'owner'
            ? t('Отзывы выключены — клиентов не спрашивают. Включить: «Настройки» → «Правила записи» → «Отзывы после визита».')
            : t('Отзывы выключены владельцем салона.')}
        </p>
      )}
      {summary && summary.count > 0 && (
        <div className="rounded-2xl p-4 mb-4" style={cardStyle}>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-ink">{Number(summary.average).toFixed(1)}</span>
            <span className="text-lg"><Stars rating={Math.round(summary.average)} /></span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {t('Оценок: {count} из {requested} запросов', { count: summary.count, requested: summary.requested })}
            {summary.low > 0 && <span style={{ color: 'var(--c-warn-2)' }}> · {t('низких: {n}', { n: summary.low })}</span>}
          </div>
          {data.masters.length > 1 && (
            <ul className="mt-3 space-y-1">
              {data.masters.map(master => (
                <li key={master.id} className="flex justify-between gap-3 text-sm">
                  <span className="text-ink">{master.name}</span>
                  <span className="text-gray-500">★ {Number(master.average).toFixed(1)} · {master.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div role="tablist" className="flex gap-2 mb-4">
        {FILTERS.map(item => {
          const active = item.key === filter
          return (
            <button key={item.key} type="button" role="tab" aria-selected={active} onClick={() => setFilter(item.key)}
              className="min-h-[40px] px-4 rounded-xl text-sm font-medium"
              style={active ? { backgroundColor: 'var(--accent)', color: '#fff' } : { border: '1px solid var(--c-line)', color: 'var(--c-ink)' }}>
              {item.label}
            </button>
          )
        })}
      </div>
      <ErrorText className="mb-3">{error}</ErrorText>
      {!data && !error && <Spinner />}
      {data && data.results.length === 0 && (
        <div className="rounded-2xl p-5 text-sm text-gray-500" style={cardStyle}>
          {filter === 'low' ? t('Низких оценок нет.') : t('Отзывов пока нет. Клиента спрашивают через 2 часа после визита с отметкой «Пришёл» или оплатой.')}
        </div>
      )}
      {data && data.results.length > 0 && (
        <ul className="space-y-3">
          {data.results.map(review => <ReviewRow key={review.id} review={review} />)}
        </ul>
      )}
    </div>
  )
}
