import { useEffect, useState } from 'react'

const CHECK_MS = 5 * 60 * 1000

// Главный скрипт страницы (в имени — хеш сборки: /assets/index-AbC123.js)
function scriptOf(html) {
  return html.match(/<script[^>]+type="module"[^>]+src="([^"]+)"/)?.[1] || null
}

// Панель держат открытой весь день: раз в 5 минут и при возврате во вкладку
// сверяем свою сборку с сайтом. true — вышла новая версия, нужна перезагрузка
export function useNewVersion() {
  const [outdated, setOutdated] = useState(false)

  useEffect(() => {
    const current = document.querySelector('script[type="module"][src]')?.getAttribute('src')
    // В режиме разработки скрипт — исходник без хеша, сравнивать нечего
    if (!current || !current.includes('/assets/')) return
    let stopped = false

    async function check() {
      if (document.visibilityState !== 'visible') return
      try {
        const response = await fetch('/', { cache: 'no-store' })
        const latest = scriptOf(await response.text())
        if (!stopped && latest && latest !== current) setOutdated(true)
      } catch { /* нет сети — проверим в следующий раз */ }
    }

    const timer = setInterval(check, CHECK_MS)
    document.addEventListener('visibilitychange', check)
    return () => {
      stopped = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])

  return outdated
}
