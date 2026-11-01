// Общее для браузерных тестов: проверка консоли, вход в панель, выбор даты и времени.
import { test as base, expect } from '@playwright/test'

export const PASSWORD = process.env.E2E_PASSWORD || 'E2e-pass-2026!'
export const SALON = 'e2e'

// Ошибка JS, нарушение CSP, ошибка в консоли или ответ сервера 5xx — тест не прошёл.
// Ответы 4xx (неверный пароль, время заняли) — штатные: их показывает интерфейс, браузер же
// пишет о них в консоль «Failed to load resource» — такие строки не считаем
export const test = base.extend({
  page: async ({ page }, use) => {
    const problems = []
    page.on('console', m => {
      if (m.type() !== 'error') return
      if (/Failed to load resource: the server responded with a status of 4\d\d/.test(m.text())) return
      problems.push(`console: ${m.text()}`)
    })
    page.on('pageerror', e => problems.push(`js: ${e.message}`))
    page.on('response', r => { if (r.status() >= 500) problems.push(`HTTP ${r.status()} ${r.url()}`) })
    await use(page)
    expect(problems, 'ошибки в браузере').toEqual([])
  },
})
export { expect }

// Номер, которого ещё нет в базе: у номера лимиты на записи
export function uniquePhone() {
  return '69' + String(Math.floor(Math.random() * 1e6)).padStart(6, '0')
}

// Дата в часовом поясе салона: { iso: 'YYYY-MM-DD', day, month }
export function salonDate(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86_400_000)
  const iso = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Chisinau' }).format(d)
  const [, month, day] = iso.split('-').map(Number)
  return { iso, day, month }
}

// Календарь на странице записи: выбрать день через offsetDays дней
export async function pickDay(page, offsetDays) {
  const target = salonDate(offsetDays)
  if (target.month !== salonDate(0).month) await page.getByRole('button', { name: 'Следующий месяц' }).click()
  await page.locator('.grid-cols-7 button:not([disabled])', { hasText: new RegExp(`^${target.day}$`) }).click()
}

// Первое свободное время в выбранный день → { time }
export async function pickFirstSlot(page) {
  await expect(page.getByText('Свободное время')).toBeVisible()
  const slot = page.locator('.grid-cols-4 button').first()
  const time = (await slot.textContent()).trim()
  await slot.click()
  return time
}

// Форма подтверждения → «Записаться»
export async function fillAndBook(page, { name, phone }) {
  await expect(page.getByText('Проверьте детали записи')).toBeVisible()
  await page.getByPlaceholder('Имя').fill(name)
  await page.locator('input[type="tel"]').fill(phone)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Записаться' }).click()
}

export async function staffLogin(page, username = 'e2e_owner') {
  await page.goto('/admin-panel/login')
  await page.getByLabel('Логин или телефон').fill(username)
  await page.getByLabel('Пароль').fill(PASSWORD)
  await page.getByRole('button', { name: 'Войти' }).click()
  await page.waitForURL(url => !url.pathname.endsWith('/login'))
}

// Токен персонала для подготовки данных через API
export async function staffToken(request, username = 'e2e_owner') {
  const response = await request.post('/api/staff/auth/login/', { data: { username, password: PASSWORD } })
  expect(response.ok()).toBeTruthy()
  return (await response.json()).access
}

export async function setAutoConfirm(request, value) {
  const token = await staffToken(request)
  const response = await request.patch('/api/staff/company/', { data: { auto_confirm: value }, headers: { Authorization: `Bearer ${token}` } })
  expect(response.ok()).toBeTruthy()
}

// Журнал: дневной вид, сдвиг на offsetDays дней от сегодня
export async function openJournalDay(page, offsetDays) {
  await page.goto('/admin-panel')
  await page.getByRole('button', { name: 'День', exact: true }).click()
  const step = offsetDays < 0 ? 'Предыдущий день' : 'Следующий день'
  for (let i = 0; i < Math.abs(offsetDays); i++) await page.getByRole('button', { name: step }).click()
}
