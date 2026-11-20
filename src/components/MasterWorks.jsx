import { useEffect, useState } from 'react'
import { fetchMasterReviews, fetchMasterWorks } from '../api/masters'
import { formatPrice } from '../utils/format'
import { t } from '../i18n'

// Окно «Работы мастера»: сетка фото (нажатие — крупно, с услугой и ценой) и отзывы клиентов,
// разрешивших их показать. onBook — записаться к этому мастеру.
export default function MasterWorks({ master, onClose, onBook }) {
  const [works, setWorks] = useState(null)
  const [reviews, setReviews] = useState([])
  const [open, setOpen] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchMasterWorks(master.id).then(list => { if (!cancelled) setWorks(list) }).catch(() => { if (!cancelled) setWorks([]) })
    fetchMasterReviews(master.id)
      .then(data => { if (!cancelled) setReviews((data.reviews || []).filter(r => r.comment).slice(0, 10)) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [master.id])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') (open ? setOpen(null) : onClose()) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div role="dialog" aria-modal="true" aria-label={t('Работы мастера {name}', { name: master.name })}
      className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: '#111' }}>
      <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: '1px solid #242424' }}>
        <div className="min-w-0">
          <div className="text-white text-base font-medium wrap-anywhere">{master.name}</div>
          <div className="text-gray-500 text-xs">{t('Работы мастера')}</div>
        </div>
        <button type="button" onClick={onClose} className="min-h-[44px] px-4 rounded-2xl text-white text-sm"
          style={{ backgroundColor: '#242424' }}>{t('Закрыть')}</button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {works === null && <p className="text-gray-500 text-sm">{t('Загрузка…')}</p>}
        {works && works.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5">
            {works.map(work => (
              <button key={work.id} type="button" onClick={() => setOpen(work)} className="aspect-square rounded-xl overflow-hidden"
                style={{ backgroundColor: '#242424' }} aria-label={work.service?.name || t('Открыть фото')}>
                <img src={work.url} alt="" loading="lazy" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
        {works && works.length === 0 && reviews.length === 0 && <p className="text-gray-500 text-sm">{t('Работ пока нет.')}</p>}
        {reviews.length > 0 && (
          <div className="mt-6">
            <div className="text-white text-sm font-medium mb-2">{t('Отзывы клиентов')}</div>
            <ul className="space-y-2">
              {reviews.map(review => (
                <li key={review.id} className="rounded-2xl p-3" style={{ backgroundColor: '#1b1b1b' }}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-white text-sm">{review.client_name}</span>
                    <span aria-label={t('{n} из 5', { n: review.rating })}>
                      {[1, 2, 3, 4, 5].map(i => <span key={i} style={{ color: i <= review.rating ? '#f59e0b' : '#374151' }}>★</span>)}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mt-1 whitespace-pre-line wrap-anywhere">{review.comment}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {onBook && (
        <div className="px-4 py-3" style={{ borderTop: '1px solid #242424' }}>
          <button type="button" onClick={onBook} className="w-full min-h-[48px] rounded-2xl text-white text-sm font-medium"
            style={{ backgroundColor: 'var(--accent)' }}>{t('Записаться к мастеру')}</button>
        </div>
      )}
      {open && (
        <div role="dialog" aria-modal="true" aria-label={open.service?.name || t('Фото работы')} onClick={() => setOpen(null)}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)' }}>
          <img src={open.url} alt={open.service?.name || ''} className="max-w-full max-h-[70vh] rounded-2xl object-contain" />
          {open.service && (
            <div className="text-white text-base font-medium mt-4 text-center wrap-anywhere">
              {open.service.name} · {formatPrice(open.service.price)}
            </div>
          )}
          <button type="button" onClick={() => setOpen(null)} className="mt-5 px-6 py-3 rounded-2xl text-white text-sm font-medium"
            style={{ backgroundColor: '#2e2e2e' }}>{t('Закрыть')}</button>
        </div>
      )}
    </div>
  )
}
