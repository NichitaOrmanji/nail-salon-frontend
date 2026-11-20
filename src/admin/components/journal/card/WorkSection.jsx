import { useEffect, useState } from 'react'
import { fetchVisitWork, saveWorkNotes, uploadVisitPhoto } from '../../../api/works'
import { useStaffAuth } from '../../../context/StaffAuthContext'
import { AddPhotoButton, WorkPhotoGrid } from '../../WorkPhotos'
import { Button, ErrorText, TextArea } from '../../ui'
import { formatShortDate } from '../../../utils/time'
import { Section } from './ClientColumn'
import { t } from '../../../../i18n'

// «Работа»: фото и «Материалы и детали» этого визита, а сверху — что делали клиенту в прошлый раз
export default function WorkSection({ a }) {
  const { isManager } = useStaffAuth()
  const [data, setData] = useState(null)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchVisitWork(a.id)
      .then(result => { if (!cancelled) { setData(result); setNotes(result.notes) } })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [a.id])

  if (!data) return error ? <Section title={t('Работа')}><ErrorText>{error}</ErrorText></Section> : null

  async function saveNotes() {
    setBusy(true)
    setError(null)
    try {
      const saved = await saveWorkNotes(a.id, notes)
      setData(saved)
      setNotes(saved.notes)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function addPhoto(blob) {
    const photo = await uploadVisitPhoto(a.id, blob)
    setData(prev => ({ ...prev, photos: [...prev.photos, photo] }))
  }

  const previous = data.previous
  const changed = notes.trim() !== data.notes
  return (
    <Section title={t('Работа')}>
      {previous && (
        <div className="rounded-xl p-3 mb-3" style={{ backgroundColor: 'var(--c-raised)' }}>
          <div className="text-xs text-gray-500">
            {t('В прошлый раз — {date}', { date: formatShortDate(previous.date) })}
            {[previous.service, previous.master].filter(Boolean).length > 0 && ` · ${[previous.service, previous.master].filter(Boolean).join(' · ')}`}
          </div>
          {previous.notes && <p className="text-sm mt-1 whitespace-pre-line" style={{ color: 'var(--c-ink)' }}>{previous.notes}</p>}
          {previous.photos.length > 0 && (
            <div className="flex gap-2 mt-2 overflow-x-auto">
              <WorkPhotoGrid photos={previous.photos} onChange={() => {}} readOnly size="w-16 h-16" />
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <WorkPhotoGrid photos={data.photos} onChange={photos => setData(prev => ({ ...prev, photos }))} canHide={isManager} />
        {data.photos.length < data.max_photos && <AddPhotoButton onFile={addPhoto} disabled={busy} />}
      </div>
      <label className="block text-xs text-gray-500 mt-3 mb-1" htmlFor={`work-notes-${a.id}`}>{t('Материалы и детали')}</label>
      <TextArea id={`work-notes-${a.id}`} value={notes} onChange={e => setNotes(e.target.value)} rows={2}
        placeholder={t('Например: гель Kodi 45, форма миндаль, длина 2')} />
      {changed && (
        <div className="flex justify-end gap-2 mt-2">
          <Button onClick={() => setNotes(data.notes)} disabled={busy}>{t('Отменить')}</Button>
          <Button variant="primary" onClick={saveNotes} disabled={busy}>{t('Сохранить')}</Button>
        </div>
      )}
      <ErrorText className="mt-2">{error}</ErrorText>
      <p className="text-gray-500 text-xs mt-2">
        {t('Фото попадают в работы мастера на сайте записи. Если на фото лицо клиента — показывайте только с его разрешения.')}
      </p>
    </Section>
  )
}
