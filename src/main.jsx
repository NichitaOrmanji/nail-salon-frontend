import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initSentry } from './sentry'
import { applyAdminAppearance, readCachedAppearance } from './utils/appearance'

initSentry()

// Страница продукта грузится отдельным файлом: сразу красим фон в её тему, чтобы в светлой
// теме не мелькал тёмный экран (ключ и цвета — как в pages/LandingPage.jsx и landing.css)
const { pathname, hostname } = window.location
if (pathname === '/welcome' || (pathname === '/' && ['timepoint.tech', 'www.timepoint.tech'].includes(hostname))) {
  let saved = null
  try { saved = localStorage.getItem('tp-landing-theme') } catch { /* хранилище недоступно */ }
  const dark = saved === 'dark' || saved === 'light' ? saved === 'dark' : window.matchMedia?.('(prefers-color-scheme: dark)').matches
  document.body.style.backgroundColor = dark ? '#09090b' : '#f8fafc'
}

// Панель салона: сразу своя тема и цвет (из прошлого входа), пока грузится код и профиль
if (pathname.startsWith('/admin-panel')) applyAdminAppearance(readCachedAppearance())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
