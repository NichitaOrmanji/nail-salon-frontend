// Самостоятельная регистрация салона: от формы до записи клиента и восстановления пароля.
import { test, expect, linkFromEmail, NEW_PASSWORD, PASSWORD } from './fixtures'

test('регистрация → подтверждение email → салон открыт → забыли пароль → вход @desktop', async ({ page, request }) => {
  const n = Date.now() % 1_000_000
  const name = `Тест Салон ${n}`
  const email = `owner${n}@example.com`

  // 1. Регистрация со страницы входа
  await page.goto('/admin-panel/login')
  await page.getByRole('link', { name: 'Создать за 2 минуты' }).click()
  await page.getByLabel('Название салона').fill(name)
  await expect(page.getByText('✓ Адрес свободен')).toBeVisible()
  const slug = await page.getByLabel('Адрес сайта записи').inputValue()
  expect(slug).toBe(`test-salon-${n}`)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Пароль').fill(PASSWORD)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Создать салон' }).click()

  // 2. Сразу в панели: «О салоне» с шагами настройки, салон ещё не виден клиентам
  await expect(page.getByRole('heading', { name: 'О салоне' })).toBeVisible()
  await expect(page.getByText(`Салон «${name}» создан`)).toBeVisible()
  await expect(page.getByText(/Подтвердите email .* до этого клиенты не видят/)).toBeVisible()
  const client = await page.context().newPage()
  await client.goto(`/?salon=${slug}`)
  await expect(client.getByText('Салон не найден')).toBeVisible()

  // 3. Письмо → подтверждение → баннер исчез
  await page.goto(await linkFromEmail(email, '/admin-panel/verify-email'))
  await expect(page.getByText('✓ Email подтверждён')).toBeVisible()
  await page.getByRole('link', { name: 'Продолжить настройку' }).click()
  await expect(page.getByText(/до этого клиенты не видят/)).toHaveCount(0)

  // 4. Минимальная настройка (через API панели) → ссылка готова, клиент видит салон
  const token = await page.evaluate(() => sessionStorage.getItem('staff_access_token') || localStorage.getItem('staff_access_token'))
  const headers = { Authorization: `Bearer ${token}` }
  const service = await (await request.post('/api/staff/services/', { headers, data: { name: 'Маникюр', duration: 60, price: 250 } })).json()
  const master = await (await request.post('/api/staff/masters/', { headers, data: { name: 'Ольга', services: [service.id] } })).json()
  const week = Array.from({ length: 7 }, (_, d) => ({ day_of_week: d, is_working: true, start_time: '08:00', end_time: '22:00' }))
  expect((await request.put(`/api/staff/masters/${master.id}/schedule/`, { headers, data: week })).ok()).toBeTruthy()
  await page.reload()
  await expect(page.getByText('4 из 6')).toBeVisible()  // email, услуги, мастер, график
  await expect(page.getByRole('button', { name: 'Скопировать ссылку' })).toBeVisible()
  await expect(page.getByAltText(/QR-код/)).toBeVisible()
  await client.goto(`/?salon=${slug}`)
  await expect(client.getByRole('heading', { name })).toBeVisible()

  // 5. Выход → «Забыли пароль?» → письмо → новый пароль → вход по email в другом регистре
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
  await page.goto('/admin-panel/login')
  await page.getByRole('link', { name: 'Забыли пароль?' }).click()
  // Поле входа «Логин, email или телефон» тоже подходит под подпись «Email» — ждём страницу восстановления
  await expect(page).toHaveURL(/\/admin-panel\/forgot-password$/)
  // Страница может дорисоваться после первого ввода (на медленном CI ввод терялся) — вводим, пока кнопка не станет доступна
  await page.waitForLoadState('networkidle')
  const sendLink = page.getByRole('button', { name: 'Отправить ссылку' })
  await expect(async () => {
    await page.getByLabel('Email').fill(email)
    await expect(sendLink).toBeEnabled({ timeout: 1000 })
  }).toPass({ timeout: 15_000 })
  await sendLink.click()
  await expect(page.getByText(/мы отправили на него ссылку/)).toBeVisible()
  await page.goto(await linkFromEmail(email, '/admin-panel/reset-password'))
  await page.getByLabel('Новый пароль').fill(NEW_PASSWORD)
  await page.getByLabel('Повторите пароль').fill(NEW_PASSWORD)
  await page.getByRole('button', { name: 'Сохранить пароль' }).click()
  await expect(page.getByText('Пароль изменён')).toBeVisible()
  await page.getByRole('link', { name: 'Войти' }).click()
  await page.getByLabel('Логин, email или телефон').fill(email.toUpperCase())
  await page.getByLabel('Пароль').fill(NEW_PASSWORD)
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page.getByRole('button', { name: 'Сегодня' })).toBeVisible()
  await client.close()
})

test('занятый и служебный адрес — подсказка свободного', async ({ page }) => {
  await page.goto('/admin-panel/signup')
  await page.getByLabel('Адрес сайта записи').fill('e2e')
  await expect(page.getByText(/служебный/)).toBeVisible()
  await page.getByLabel('Название салона').fill('E2E Салон')
  await page.getByLabel('Адрес сайта записи').fill('admin-x')
  await expect(page.getByText('✓ Адрес свободен')).toBeVisible()
})
