import { useEffect, useState } from 'react'
import { fetchStaffMasters } from '../api/masters'
import { fetchStaffServices } from '../api/services'
import { fetchMasterWorks, uploadMasterWork } from '../api/works'
import { useStaffAuth } from '../context/StaffAuthContext'
import { AddPhotoButton, WorkPhotoGrid } from '../components/WorkPhotos'
import { ErrorText, Field, PageHeader, Select } from '../components/ui'
import Spinner from '../../components/layout/Spinner'
import { t } from '../../i18n'

// «Портфолио»: работы мастера (из визитов и загруженные отдельно) — так их видит сайт записи
export default function PortfolioPage() {
  const { me, isManager } = useStaffAuth()
  const [masters, setMasters] = useState([])
  const [services, setServices] = useState([])
  const [masterId, setMasterId] = useState(me?.master_id || null)
  const [serviceId, setServiceId] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchStaffMasters()
      .then(list => {
        const active = list.filter(m => m.is_active)
        setMasters(active)
        setMasterId(prev => prev || active[0]?.id || null)
      })
      .catch(err => setError(err.message))
    fetchStaffServices().then(list => setServices(list.filter(s => s.is_active))).catch(() => setServices([]))
  }, [])

  useEffect(() => {
    if (!masterId) return undefined
    let cancelled = false
    fetchMasterWorks(masterId)
      .then(result => { if (!cancelled) { setData(result); setError(null) } })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [masterId])

  async function addPhoto(blob) {
    const photo = await uploadMasterWork(masterId, blob, serviceId || null)
    setData(prev => ({ ...prev, results: [photo, ...prev.results] }))
  }

  const onSite = data ? data.results.filter(p => p.public && !p.hidden).length : 0
  return (
    <div className="px-4 md:px-6 py-5 max-w-3xl">
      <PageHeader title={t('Портфолио')} subtitle={t('Работы мастера на сайте записи: из визитов и загруженные отдельно')} />
      {data && !data.enabled && (
        <p className="text-sm rounded-xl px-3 py-2 mb-4" style={{ backgroundColor: 'var(--c-card)', color: 'var(--c-muted)' }}>
          {t('Портфолио выключено. Включить: «Настройки» → «Правила записи» → «Портфолио работ».')}
        </p>
      )}
      {isManager && masters.length > 1 && (
        <Field label={t('Мастер')} className="mb-4">
          <Select value={masterId || ''} onChange={e => { setData(null); setMasterId(Number(e.target.value)) }}>
            {masters.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
        </Field>
      )}
      <ErrorText className="mb-3">{error}</ErrorText>
      {!data && !error && masterId && <Spinner />}
      {!masterId && !error && masters.length === 0 && <p className="text-sm text-gray-500">{t('Мастеров пока нет.')}</p>}
      {data && (
        <>
          <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: 'var(--c-card)', border: '1px solid var(--c-line)' }}>
            <div className="text-ink text-sm font-semibold">{t('Добавить старые работы')}</div>
            <p className="text-gray-500 text-xs mt-1 mb-3">
              {t('Чтобы портфолио не начиналось с нуля. Новые работы удобнее добавлять в карточке записи — блок «Работа».')}
            </p>
            {services.length > 0 && (
              <Field label={t('Услуга (необязательно)')} className="mb-3">
                <Select value={serviceId} onChange={e => setServiceId(e.target.value)}>
                  <option value="">{t('Без услуги')}</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </Field>
            )}
            <AddPhotoButton onFile={addPhoto} disabled={!data.enabled} label={t('Добавить')} />
          </div>
          <div className="text-sm text-gray-500 mb-2">
            {t('Всего фото: {count}, на сайте: {site}', { count: data.results.length, site: onSite })}
          </div>
          {data.results.length === 0 ? (
            <p className="text-sm text-gray-500">{t('Работ пока нет.')}</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              <WorkPhotoGrid photos={data.results} onChange={results => setData(prev => ({ ...prev, results }))}
                canHide={isManager} size="w-full aspect-square" />
            </div>
          )}
        </>
      )}
    </div>
  )
}
