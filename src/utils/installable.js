// Панель салона можно поставить иконкой на экран телефона («На экран Домой» в Safari):
// открывается как приложение, без адресной строки, а вход держится долго.
// Подключаем манифест и иконку только на страницах панели: сайт записи у каждого салона свой,
// и иконка TimePoint у клиентов салона на экране оказаться не должна.
function addTag(name, attrs) {
  if (document.head.querySelector(`${name}[data-tp-install]`)) return
  const tag = document.createElement(name)
  for (const [key, value] of Object.entries(attrs)) tag.setAttribute(key, value)
  tag.setAttribute('data-tp-install', '')
  document.head.appendChild(tag)
}

export function makePanelInstallable() {
  try {
    addTag('link', { rel: 'manifest', href: '/manifest.webmanifest' })
    addTag('link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' })
    addTag('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' })
    addTag('meta', { name: 'mobile-web-app-capable', content: 'yes' })
    addTag('meta', { name: 'apple-mobile-web-app-title', content: 'TimePoint' })
  } catch { /* страница без head — ничего не делаем */ }
}
