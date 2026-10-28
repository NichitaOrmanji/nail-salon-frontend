import { useRef, useState } from 'react'
import { PHOTO_ACCEPT, shrinkImage } from '../utils/image'
import { Button, ErrorText } from './ui'

const SHAPES = {
  wide: 'w-full max-w-sm aspect-video rounded-xl',
  square: 'w-24 h-24 rounded-xl',
  round: 'w-20 h-20 rounded-full',
}

// Фото с превью: выбрать файл -> уменьшить в браузере -> onUpload(file); «Убрать» -> onRemove().
// onUpload/onRemove — промисы; ошибку показываем здесь же
export default function PhotoField({ label, hint, url, shape = 'square', maxSide = 1600, keepPng = false, onUpload, onRemove }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(null) // 'upload' | 'remove'
  const [error, setError] = useState(null)

  async function run(kind, action) {
    setError(null)
    setBusy(kind)
    try {
      await action()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(null)
    }
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // тот же файл можно выбрать снова
    if (!file) return
    run('upload', async () => onUpload(await shrinkImage(file, maxSide, { keepPng })))
  }

  function handleRemove() {
    if (!window.confirm('Убрать фото?')) return
    run('remove', onRemove)
  }

  return (
    <div>
      {label && <div className="text-gray-400 text-xs font-medium mb-1.5">{label}</div>}
      <div className={`flex gap-3 ${shape === 'wide' ? 'flex-col' : 'items-center'}`}>
        <div
          className={`${SHAPES[shape]} overflow-hidden shrink-0 flex items-center justify-center`}
          style={{ backgroundColor: '#242424', border: '1px solid #2e2e2e' }}
        >
          {url
            ? <img src={url} alt={label || 'Фото'} className="w-full h-full object-cover" />
            : <span className="text-gray-600 text-xs px-2 text-center">Нет фото</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={!!busy} onClick={() => inputRef.current?.click()}>
            {busy === 'upload' ? 'Загружаем...' : url ? 'Заменить' : 'Загрузить'}
          </Button>
          {url && (
            <Button variant="danger" disabled={!!busy} onClick={handleRemove}>
              {busy === 'remove' ? 'Убираем...' : 'Убрать'}
            </Button>
          )}
        </div>
      </div>
      <input ref={inputRef} type="file" accept={PHOTO_ACCEPT} className="hidden" onChange={handleFile} data-testid="photo-input" />
      {hint && <p className="text-gray-500 text-xs mt-1.5">{hint}</p>}
      <ErrorText className="mt-2">{error}</ErrorText>
    </div>
  )
}
