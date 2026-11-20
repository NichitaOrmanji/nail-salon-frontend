import { useRef, useState } from 'react'
import { deleteWorkPhoto, updateWorkPhoto } from '../api/works'
import { PHOTO_ACCEPT, shrinkImage } from '../utils/image'
import { t } from '../../i18n'

// Наибольшая сторона фото работы — сервер всё равно уменьшит до 1200 px
const WORK_SIDE = 1600

// Кнопка «Добавить фото»: открывает камеру или галерею телефона, уменьшает снимок и отдаёт onFile(blob)
export function AddPhotoButton({ onFile, disabled, label }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handle(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      await onFile(await shrinkImage(file, WORK_SIDE))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled || busy}
        className="w-20 h-20 rounded-xl flex flex-col items-center justify-center text-xs gap-1 disabled:opacity-50"
        style={{ border: '1px dashed var(--c-line-2)', color: 'var(--c-muted)' }}>
        <span className="text-2xl leading-none" aria-hidden="true">{busy ? '…' : '+'}</span>
        {label || t('Фото')}
      </button>
      <input ref={inputRef} type="file" accept={PHOTO_ACCEPT} className="hidden" onChange={handle} data-testid="work-photo-input" />
      {error && <p className="text-xs mt-1" style={{ color: 'var(--c-danger)' }}>{error}</p>}
    </div>
  )
}

// Фото работы: нажатие — крупно; под крупным фото — «на сайте» (мастер), «скрыть» (владелец), «удалить»
export function WorkPhotoGrid({ photos, onChange, canHide = false, readOnly = false, size = 'w-20 h-20' }) {
  const [open, setOpen] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function run(action) {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const togglePublic = photo => run(async () => {
    const saved = await updateWorkPhoto(photo.id, { public: !photo.public })
    onChange(photos.map(p => (p.id === saved.id ? saved : p)))
    setOpen(saved)
  })
  const toggleHidden = photo => run(async () => {
    const saved = await updateWorkPhoto(photo.id, { hidden: !photo.hidden })
    onChange(photos.map(p => (p.id === saved.id ? saved : p)))
    setOpen(saved)
  })
  const remove = photo => run(async () => {
    if (!window.confirm(t('Удалить фото?'))) return
    await deleteWorkPhoto(photo.id)
    onChange(photos.filter(p => p.id !== photo.id))
    setOpen(null)
  })

  return (
    <>
      {photos.map(photo => (
        <button key={photo.id} type="button" onClick={() => { setError(null); setOpen(photo) }}
          className={`${size} rounded-xl overflow-hidden relative flex-shrink-0`} style={{ backgroundColor: 'var(--c-raised)' }}
          aria-label={t('Открыть фото')}>
          <img src={photo.url} alt="" loading="lazy" className="w-full h-full object-cover" />
          {!readOnly && (!photo.public || photo.hidden) && (
            <span className="absolute bottom-1 left-1 right-1 text-[10px] leading-tight rounded px-1 py-0.5 text-white"
              style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}>
              {photo.hidden ? t('Скрыто') : t('Не на сайте')}
            </span>
          )}
        </button>
      ))}
      {open && (
        <div role="dialog" aria-modal="true" aria-label={t('Фото работы')} onClick={() => setOpen(null)}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}>
          <img src={open.url} alt="" className="max-w-full max-h-[65vh] rounded-2xl object-contain" />
          {open.service && <div className="text-white text-sm mt-3">{open.service.name}</div>}
          <div className="flex flex-wrap justify-center gap-2 mt-4" onClick={e => e.stopPropagation()}>
            {!readOnly && (
              <button type="button" disabled={busy} onClick={() => togglePublic(open)}
                className="min-h-[44px] px-4 rounded-2xl text-white text-sm" style={{ backgroundColor: '#2e2e2e' }}>
                {open.public ? t('Не показывать на сайте') : t('Показывать на сайте')}
              </button>
            )}
            {!readOnly && canHide && (
              <button type="button" disabled={busy} onClick={() => toggleHidden(open)}
                className="min-h-[44px] px-4 rounded-2xl text-white text-sm" style={{ backgroundColor: '#2e2e2e' }}>
                {open.hidden ? t('Вернуть на сайт') : t('Скрыть с сайта')}
              </button>
            )}
            {!readOnly && (
              <button type="button" disabled={busy} onClick={() => remove(open)}
                className="min-h-[44px] px-4 rounded-2xl text-sm" style={{ backgroundColor: '#2e2e2e', color: '#fca5a5' }}>
                {t('Удалить')}
              </button>
            )}
            <button type="button" onClick={() => setOpen(null)}
              className="min-h-[44px] px-5 rounded-2xl text-white text-sm font-medium" style={{ backgroundColor: '#2e2e2e' }}>
              {t('Закрыть')}
            </button>
          </div>
          {!readOnly && !open.hidden && (
            <p className="text-gray-400 text-xs mt-3 text-center max-w-xs">
              {open.public ? t('Фото видно на сайте записи в работах мастера.') : t('Фото видно только в панели.')}
            </p>
          )}
          {error && <p className="text-xs mt-2" style={{ color: '#fca5a5' }}>{error}</p>}
        </div>
      )}
    </>
  )
}
