// Сервер для браузерных тестов: отдаёт dist/ с заголовками из vercel.json (CSP и т. д.),
// /api проксирует на бэкенд, как Vercel в продакшене. Остальные пути — index.html (SPA).
// Запуск: E2E_BACKEND=http://127.0.0.1:8000 node e2e/serve.mjs  (порт E2E_PORT, по умолчанию 5300)
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const PORT = Number(process.env.E2E_PORT || 5300)
const backend = new URL(process.env.E2E_BACKEND || 'http://127.0.0.1:8000')
const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'))
// Правила headers из vercel.json: source вида /(.*) или /assets/(.*) → регулярное выражение
const toRegExp = source => new RegExp('^' + source.split('(.*)').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$')
const RULES = (vercel.headers || []).map(rule => ({
  test: toRegExp(rule.source),
  headers: Object.fromEntries(rule.headers.map(h => [h.key, h.value])),
}))
function headersFor(urlPath) {
  // Как Vercel: по умолчанию браузер переспрашивает файл каждый раз; правила дополняют и заменяют
  let result = { 'Cache-Control': 'public, max-age=0, must-revalidate' }
  for (const rule of RULES) if (rule.test.test(urlPath)) result = { ...result, ...rule.headers }
  return result
}
const TYPES = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.json': 'application/json',
  '.woff2': 'font/woff2', '.txt': 'text/plain' }

http.createServer((req, res) => {
  if (req.url.startsWith('/api/')) {
    const proxy = http.request({
      host: backend.hostname, port: backend.port, path: req.url, method: req.method,
      // Как Vercel: адрес клиента — в X-Real-IP
      headers: { ...req.headers, host: backend.host, 'x-real-ip': req.socket.remoteAddress || '127.0.0.1' },
    }, upstream => { res.writeHead(upstream.statusCode, upstream.headers); upstream.pipe(res) })
    proxy.on('error', err => { res.writeHead(502); res.end(`backend: ${err.message}`) })
    req.pipe(proxy)
    return
  }
  const urlPath = decodeURIComponent(req.url.split('?')[0])
  let file = path.join(DIST, urlPath)
  if (!file.startsWith(DIST) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html')
  const stat = fs.statSync(file)
  const etag = `"${stat.size}-${stat.mtimeMs}"`
  const headers = { ...headersFor(urlPath), ETag: etag, 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); res.end(); return }
  // Как Vercel: текстовые файлы сжаты brotli
  if (/^(text\/|application\/json|image\/svg)/.test(headers['content-type']) && /\bbr\b/.test(req.headers['accept-encoding'] || '')) {
    res.writeHead(200, { ...headers, 'Content-Encoding': 'br', Vary: 'Accept-Encoding' })
    fs.createReadStream(file).pipe(zlib.createBrotliCompress()).pipe(res)
    return
  }
  res.writeHead(200, headers)
  fs.createReadStream(file).pipe(res)
}).listen(PORT, () => console.log(`e2e: http://localhost:${PORT} → ${backend.origin}`))
