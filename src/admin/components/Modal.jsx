import { useEffect, useRef } from 'react'
import { IconClose } from './Icons'

// Модальное окно: на экранах < 640px — на весь экран, иначе — по центру.
// Закрывается крестиком и Escape (не кликом мимо — чтобы не потерять ввод)
export default function Modal({ title, onClose, children, footer, maxWidth = 'sm:max-w-lg' }) {
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onCloseRef.current?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full h-full sm:h-auto sm:max-h-[90vh] ${maxWidth} sm:rounded-2xl flex flex-col overflow-hidden`}
        style={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e' }}
      >
        <div className="flex items-center gap-3 pl-5 pr-2 py-2 flex-shrink-0" style={{ borderBottom: '1px solid #2e2e2e' }}>
          <h2 className="flex-1 min-w-0 text-white text-base font-semibold truncate">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-400 active:scale-90"
          >
            <IconClose />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          {children}
        </div>
        {footer && (
          <div className="flex-shrink-0 px-5 py-3 flex flex-wrap gap-2 justify-end" style={{ borderTop: '1px solid #2e2e2e' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
