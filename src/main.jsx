import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/manrope'
import './theme.css'
import './index.css'
import { initTheme } from './theme'
import App from './App.jsx'
import { initSentry } from './sentry'

initSentry()
// Тема до первого рендера — без мигания
initTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
