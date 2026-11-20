import { t } from '../../i18n'
import { formatShortDate } from './time'

// Картинка «Свободные окна» для сторис 1080×1920 — рисуется в браузере, сервер не нагружает
export const STORY_W = 1080
export const STORY_H = 1920
const PAD = 90
const LIST_BOTTOM = 1470

export const TEMPLATES = [
  { id: 'photo', label: 'Фото салона' },
  { id: 'accent', label: 'Цвет сайта' },
  { id: 'light', label: 'Светлый' },
]

function fontFamily() {
  try {
    return getComputedStyle(document.body).fontFamily || 'sans-serif'
  } catch {
    return 'sans-serif'
  }
}

// Фото с другого адреса (облако) — с разрешением CORS, иначе картинку нельзя будет сохранить
export function loadImage(url) {
  return new Promise(resolve => {
    if (!url) { resolve(null); return }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

function cover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height)
  const sw = w / scale
  const sh = h / scale
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h)
}

// Размытие без ctx.filter (его нет в Safari): уменьшаем и растягиваем обратно
function blurred(img) {
  const small = document.createElement('canvas')
  small.width = 54
  small.height = 96
  cover(small.getContext('2d'), img, 0, 0, small.width, small.height)
  return small
}

function wrap(ctx, text, maxWidth) {
  const words = String(text).split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

function fitText(ctx, text, maxWidth, size, weight, family) {
  let current = size
  ctx.font = `${weight} ${current}px ${family}`
  while (current > 28 && ctx.measureText(text).width > maxWidth) {
    current -= 2
    ctx.font = `${weight} ${current}px ${family}`
  }
  return current
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function windowsText(windows) {
  return windows.map(w => `${w.from}–${w.to}`).join(' · ')
}

// Подпись периода: «на сегодня · Пт, 20 ноября», «на неделю»
export function periodLabel(range, date) {
  if (range === 'week') return t('на неделю')
  return `${range === 'today' ? t('на сегодня') : t('на завтра')} · ${formatShortDate(date)}`
}

/**
 * days — [{ date, masters: [{ name, windows }] }] (только дни и мастера с окнами)
 * look — { template, accent, name, logo, photo, qr, address, period }
 * logo, photo, qr — загруженные картинки (или null)
 */
export function drawStory(canvas, days, look) {
  canvas.width = STORY_W
  canvas.height = STORY_H
  const ctx = canvas.getContext('2d')
  const family = fontFamily()
  const light = look.template === 'light'
  const ink = light ? '#1a1a1a' : '#ffffff'
  const muted = light ? 'rgba(26,26,26,0.62)' : 'rgba(255,255,255,0.72)'
  const accent = look.accent

  // Фон
  if (look.template === 'photo' && look.photo) {
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(blurred(look.photo), 0, 0, STORY_W, STORY_H)
    ctx.fillStyle = 'rgba(0,0,0,0.58)'
    ctx.fillRect(0, 0, STORY_W, STORY_H)
  } else if (look.template === 'accent') {
    ctx.fillStyle = accent
    ctx.fillRect(0, 0, STORY_W, STORY_H)
    ctx.fillStyle = 'rgba(0,0,0,0.22)'
    ctx.fillRect(0, 0, STORY_W, STORY_H)
  } else if (light) {
    ctx.fillStyle = '#faf7f5'
    ctx.fillRect(0, 0, STORY_W, STORY_H)
    ctx.fillStyle = accent
    ctx.fillRect(0, 0, STORY_W, 18)
  } else {
    ctx.fillStyle = '#161616'
    ctx.fillRect(0, 0, STORY_W, STORY_H)
  }
  ctx.textBaseline = 'alphabetic'

  // Шапка: логотип и название
  let x = PAD
  const headY = 130
  if (look.logo) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(PAD + 60, headY + 60, 60, 0, Math.PI * 2)
    ctx.closePath()
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.clip()
    cover(ctx, look.logo, PAD, headY, 120, 120)
    ctx.restore()
    x = PAD + 150
  }
  ctx.fillStyle = ink
  fitText(ctx, look.name, STORY_W - x - PAD, 52, 700, family)
  ctx.fillText(look.name, x, headY + 78)

  // Заголовок
  let y = 440
  ctx.fillStyle = ink
  ctx.font = `800 128px ${family}`
  for (const line of wrap(ctx, t('Свободные окна'), STORY_W - PAD * 2)) {
    ctx.fillText(line, PAD, y)
    y += 136
  }
  ctx.fillStyle = light ? accent : muted
  fitText(ctx, look.period, STORY_W - PAD * 2, 50, 600, family)
  ctx.fillText(look.period, PAD, y - 40)
  y += 70

  // Мастера и окна
  const week = days.length > 1
  let cut = false
  outer:
  for (const day of days) {
    if (week) {
      if (y + 60 > LIST_BOTTOM) { cut = true; break }
      ctx.fillStyle = light ? accent : ink
      ctx.font = `700 46px ${family}`
      ctx.fillText(formatShortDate(day.date), PAD, y)
      y += 64
    }
    for (const master of day.masters) {
      if (week) {
        // Неделя: «Анна  10:00–13:00 · 15:00–18:00» в одну строку (длинные окна — переносом)
        ctx.font = `700 44px ${family}`
        const nameWidth = ctx.measureText(master.name).width + 24
        ctx.font = `500 42px ${family}`
        const rest = STORY_W - PAD * 2 - nameWidth
        const lines = rest > 260 ? wrap(ctx, windowsText(master.windows), rest) : ['', ...wrap(ctx, windowsText(master.windows), STORY_W - PAD * 2)]
        if (y + lines.length * 54 - 40 > LIST_BOTTOM) { cut = true; break outer }
        ctx.fillStyle = ink
        ctx.font = `700 44px ${family}`
        ctx.fillText(master.name, PAD, y)
        ctx.fillStyle = muted
        ctx.font = `500 42px ${family}`
        lines.forEach((line, i) => ctx.fillText(line, i === 0 || rest > 260 ? PAD + (rest > 260 ? nameWidth : 0) : PAD, y + i * 54))
        y += lines.length * 54 + 6
        continue
      }
      ctx.font = `500 46px ${family}`
      const lines = wrap(ctx, windowsText(master.windows), STORY_W - PAD * 2)
      const height = 62 + lines.length * 58 + 26
      if (y + height - 40 > LIST_BOTTOM) { cut = true; break outer }
      ctx.fillStyle = ink
      ctx.font = `700 52px ${family}`
      ctx.fillText(master.name, PAD, y)
      y += 62
      ctx.fillStyle = muted
      ctx.font = `500 46px ${family}`
      for (const line of lines) {
        ctx.fillText(line, PAD, y)
        y += 58
      }
      y += 26
    }
    if (week) y += 30
  }
  if (cut) {
    ctx.fillStyle = muted
    ctx.font = `500 42px ${family}`
    ctx.fillText(t('и другие окна — на сайте'), PAD, Math.min(y, LIST_BOTTOM + 40))
  }

  // Низ: QR-код и адрес
  const boxY = 1540
  const boxH = 290
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, PAD, boxY, STORY_W - PAD * 2, boxH, 36)
  ctx.fill()
  let textX = PAD + 50
  if (look.qr) {
    ctx.drawImage(look.qr, PAD + 25, boxY + 25, boxH - 50, boxH - 50)
    textX = PAD + boxH + 10
  }
  const textW = STORY_W - PAD - 40 - textX
  ctx.fillStyle = '#111111'
  fitText(ctx, t('Записаться онлайн'), textW, 54, 800, family)
  ctx.fillText(t('Записаться онлайн'), textX, boxY + 125)
  ctx.fillStyle = accent
  fitText(ctx, look.address, textW, 42, 600, family)
  ctx.fillText(look.address, textX, boxY + 190)
}
