import { useEffect, useRef } from 'react'
import { IconClose } from './Icons'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
const FIELDS = 'input:not([disabled]):not([type="hidden"]):not([readonly]), select:not([disabled]), textarea:not([disabled]):not([readonly])'

function focusableIn(root) {
  if (!root) return []
  return [...root.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null || el === document.activeElement)
}

// Модальное окно: на экранах < 640px — на весь экран, иначе — по центру.
// Закрывается крестиком и Escape (не кликом мимо — чтобы не потерять ввод).
// Фокус: при открытии — первое поле, Tab не уходит за окно, при закрытии — обратно
export default function Modal({ title, onClose, children, footer, maxWidth = 'sm:max-w-lg' }) {
  const onCloseRef = useRef(onClose)
  const dialogRef = useRef(null)
  const bodyRef = useRef(null)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') {
        onCloseRef.current?.()
        return
      }
      if (e.key !== 'Tab') return
      const dialog = dialogRef.current
      const items = focusableIn(dialog)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (!dialog.contains(active)) {
        e.preventDefault()
        ;(e.shiftKey ? last : first).focus()
      } else if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Начальный фокус и возврат фокуса туда, откуда открыли
  useEffect(() => {
    const previous = document.activeElement
    const target = bodyRef.current?.querySelector(FIELDS) || focusableIn(bodyRef.current)[0] || focusableIn(dialogRef.current)[0]
    target?.focus({ preventScroll: true })
    return () => {
      if (previous && previous.isConnected && typeof previous.focus === 'function') {
        previous.focus({ preventScroll: true })
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}>
      <div
        ref={dialogRef}
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
        <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
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
