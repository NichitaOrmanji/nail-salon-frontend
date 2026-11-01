// Личный кабинет клиента, правила салона, язык, служебные страницы.
import { test, expect, uniquePhone, PASSWORD } from './fixtures'

test('регистрация клиента и удаление аккаунта', async ({ page, request }) => {
  const phone = uniquePhone()
  await page.goto('/profile')
  await page.getByRole('button', { name: 'Регистрация' }).click()
  await page.locator('input[type="tel"]').fill(phone)
  await page.locator('input[type="password"]').fill(PASSWORD)
  await page.getByPlaceholder('Имя', { exact: true }).fill('Кабинет Тест')
  await page.getByRole('button', { name: 'Зарегистрироваться' }).click()
  await page.waitForURL(url => url.pathname === '/')

  await page.goto('/account')
  await expect(page.getByRole('heading', { name: 'Мои записи' })).toBeVisible()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Удалить аккаунт' }).click()
  await page.waitForURL(url => url.pathname === '/')

  const login = await request.post('/api/auth/login/', { data: { phone: '+373' + phone, password: PASSWORD } })
  expect(login.ok()).toBeFalsy()
})

test('правила салона из настроек, на русском и румынском @desktop', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Правила салона' }).click()
  await expect(page.getByText('Неявка и поздняя отмена — чёрный список')).toBeVisible()
  await expect(page.getByText(/меньше чем за 3 ч до визита.*штраф 50%/)).toBeVisible()

  await page.goto('/')
  await page.getByRole('button', { name: 'RO' }).click()
  await page.goto('/rules')
  await expect(page.getByText('Regulile salonului', { exact: true })).toBeVisible()
  await expect(page.getByText(/amendă de 50%/)).toBeVisible()
})

test('политика конфиденциальности и несуществующая страница @desktop', async ({ page }) => {
  await page.goto('/privacy')
  await expect(page.getByText('Политика конфиденциальности').first()).toBeVisible()
  await page.goto('/no-such-page')
  await expect(page.getByText('Страница не найдена')).toBeVisible()
})

test('страницы помещаются по ширине экрана @desktop', async ({ page }) => {
  for (const path of ['/', '/rules', '/privacy', '/profile', '/admin-panel/login']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow, path).toBeLessThanOrEqual(0)
  }
})
