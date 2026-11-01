// Панель салона: вход, оплата, неявка и чёрный список, удаление данных клиента, права ролей.
// Вчерашние записи «Оплата Тест», «Должник Тест», «Клиент Удалить» создаёт e2e_seed.
import { test, expect, staffLogin, openJournalDay, PASSWORD } from './fixtures'

test('неверный пароль — ошибка, верный — журнал @desktop', async ({ page }) => {
  await page.goto('/admin-panel/login')
  await page.getByLabel('Логин или телефон').fill('e2e_owner')
  await page.getByLabel('Пароль').fill(PASSWORD + 'x')
  await page.getByRole('button', { name: 'Войти' }).click()
  await expect(page.getByText(/Неверный логин или пароль/)).toBeVisible()

  await staffLogin(page)
  await expect(page.getByRole('button', { name: 'Сегодня' })).toBeVisible()
})

test('оплата визита из журнала', async ({ page }) => {
  await staffLogin(page)
  await openJournalDay(page, -1)
  await page.getByTitle(/Оплата Тест/).first().click()
  await page.getByRole('button', { name: 'Оплата', exact: true }).click()
  await page.getByRole('button', { name: 'Оплачено' }).click()
  await expect(page.getByRole('button', { name: 'Отменить оплату' })).toBeVisible()
})

test('неявка → чёрный список со штрафом 50% → должники → оплата', async ({ page }) => {
  await staffLogin(page)
  await openJournalDay(page, -1)
  await page.getByTitle(/Должник Тест/).first().click()
  await page.getByRole('button', { name: 'Не пришёл' }).click()
  await page.getByRole('button', { name: /В чёрный список, штраф 100/ }).click()

  await page.goto('/admin-panel/clients')
  await page.getByRole('button', { name: '⛔ Чёрный список', exact: true }).click()
  await expect(page.getByRole('button', { name: '⛔ Чёрный список', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Должник Тест')).toBeVisible()
  await expect(page.getByText(/долг 100/)).toBeVisible()

  // Экран «Должники»: сумма, причина, оплата из карточки клиента
  await page.goto('/admin-panel/debtors')
  await expect(page.getByText('Общий долг')).toBeVisible()
  const row = page.getByRole('button', { name: /Должник Тест/ })
  await expect(row).toContainText('100 L')
  await expect(row).toContainText('Не пришёл')
  await row.click()
  await page.getByRole('button', { name: 'Оплачен', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Отменить оплату' })).toBeVisible()  // оплата сохранена
  await page.getByRole('button', { name: 'Закрыть' }).click()
  await expect(page.getByText('Должников нет')).toBeVisible()
})

test('удаление данных клиента по его просьбе', async ({ page }) => {
  await staffLogin(page)
  await page.goto('/admin-panel/clients')
  await page.getByLabel('Поиск клиента').fill('Клиент Удалить')
  await page.getByText('Клиент Удалить').first().click()
  await page.getByRole('button', { name: 'Удалить данные клиента' }).click()
  await page.getByRole('button', { name: 'Удалить навсегда' }).click()
  await expect(page.getByText('Клиент Удалить')).toHaveCount(0)
})

test('владелец: финансы, графики, помощь @desktop', async ({ page }) => {
  await staffLogin(page)
  await page.goto('/admin-panel/finance')
  await expect(page.getByRole('heading', { name: 'Финансы' })).toBeVisible()
  await page.goto('/admin-panel/masters?tab=schedules')
  await expect(page.getByRole('button', { name: 'Весь месяц' })).toBeVisible()
  await page.goto('/admin-panel/help')
  await expect(page.getByRole('button', { name: /С чего начать/ })).toBeVisible()
})

test('администратор не видит финансы, мастер — клиентов и настройки', async ({ page }) => {
  await staffLogin(page, 'e2e_admin')
  await page.goto('/admin-panel/finance')
  await expect(page.getByRole('heading', { name: 'Финансы' })).toHaveCount(0)

  await page.evaluate(() => localStorage.clear())
  await staffLogin(page, 'e2e_master')
  for (const path of ['/admin-panel/clients', '/admin-panel/settings']) {
    await page.goto(path)
    await expect(page).toHaveURL(/\/admin-panel(\?|$)/)
  }
})
