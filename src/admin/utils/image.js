// Уменьшение фото в браузере перед отправкой: с телефона приходят снимки по 5–10 МБ,
// а сайту достаточно 1600 px. Сервер всё равно проверяет и пересохраняет файл
export const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp'
const OPEN_ERROR = 'Не удалось открыть фото. Выберите JPG, PNG или WebP'

async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      // Поворот по EXIF (портретные снимки с телефона)
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch { /* старый браузер — пробуем через <img> */ }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

// -> Blob (JPEG; PNG — если keepPng и исходник PNG, чтобы логотип не потерял прозрачность)
export async function shrinkImage(file, maxSide, { keepPng = false } = {}) {
  if (!file || !file.type?.startsWith('image/')) throw new Error(OPEN_ERROR)
  let source
  try {
    source = await decode(file)
  } catch {
    throw new Error(OPEN_ERROR)
  }
  const width = source.width
  const height = source.height
  if (!width || !height) throw new Error(OPEN_ERROR)
  const scale = Math.min(1, maxSide / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const png = keepPng && file.type === 'image/png'
  const ctx = canvas.getContext('2d')
  if (!png) {
    // У JPEG нет прозрачности — подкладываем белый фон
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  source.close?.()
  const type = png ? 'image/png' : 'image/jpeg'
  const blob = await new Promise(resolve => canvas.toBlob(resolve, type, 0.85))
  if (!blob) throw new Error(OPEN_ERROR)
  return new File([blob], png ? 'photo.png' : 'photo.jpg', { type })
}
