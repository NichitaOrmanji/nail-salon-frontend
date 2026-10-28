// Ошибки сайта и панели → Sentry. Включается переменной Vercel VITE_SENTRY_DSN;
// без неё SDK даже не загружается (отдельный чанк). Персональные данные не отправляются:
// без IP и пользователя, тексты ошибок API (там бывают телефоны) — без тела ответа.
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return
  import('@sentry/react')
    .then(Sentry => {
      Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        sendDefaultPii: false,
        tracesSampleRate: 0,
        // Ошибки сети и устаревшей вкладки — не баги
        ignoreErrors: ['Нет соединения с сервером', 'Nu există conexiune cu serverul', 'Failed to fetch dynamically imported module'],
      })
    })
    .catch(() => { /* Sentry недоступен — сайт работает без него */ })
}
