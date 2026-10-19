import { useEffect, useRef } from 'react'

// После любых изменений данных (запись, выходной…) журнал и бейдж «Новые»
// перезапрашиваются. Событие — через window, чтобы не тянуть общий контекст.
const DATA_CHANGED = 'staff:data-changed'

export function notifyDataChanged() {
  window.dispatchEvent(new Event(DATA_CHANGED))
}

// Вызывает callback раз в intervalMs, при возврате на вкладку и после notifyDataChanged()
export function useAutoRefresh(callback, intervalMs = 60000) {
  const callbackRef = useRef(callback)
  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    const run = () => callbackRef.current()
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') run()
    }, intervalMs)
    const onVisible = () => {
      if (document.visibilityState === 'visible') run()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener(DATA_CHANGED, run)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener(DATA_CHANGED, run)
    }
  }, [intervalMs])
}
