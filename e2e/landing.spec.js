// Страница продукта: кнопка «Начать работу» ведёт на регистрацию; переключатель темы; доступность в обеих темах.
import AxeBuilder from '@axe-core/playwright'
import { test, expect } from './fixtures'

async function audit(page, label) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const serious = result.violations.filter(v => ['serious', 'critical'].includes(v.impact))
  expect(serious.map(v => `${v.id}: ${v.help} — ${v.nodes.slice(0, 5).map(n => n.target.join(' ')).join(' | ')}`), `доступность: ${label}`).toEqual([])
}

test('лендинг: «Начать работу» → регистрация, темы, доступность @desktop', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })
  await page.goto('/welcome')
  await expect(page.getByRole('heading', { level: 1, name: 'Онлайн-запись клиентов. Всё для вашего удобства!' })).toBeVisible()
  await expect(page.locator('.tp')).toHaveAttribute('data-theme', 'light')
  await audit(page, 'лендинг, светлая')

  await page.getByRole('button', { name: 'Тёмная тема' }).click()
  await expect(page.locator('.tp')).toHaveAttribute('data-theme', 'dark')
  await audit(page, 'лендинг, тёмная')
  await page.reload()
  await expect(page.locator('.tp')).toHaveAttribute('data-theme', 'dark')  // выбор запомнен

  await page.getByRole('link', { name: 'Начать работу' }).first().click()
  await expect(page).toHaveURL(/\/admin-panel\/signup$/)
  await expect(page.getByLabel('Название салона')).toBeVisible()

  await page.goto('/welcome')
  await page.getByRole('link', { name: 'Войти' }).first().click()
  await expect(page).toHaveURL(/\/admin-panel\/login$/)
})

test('сайт записи по-прежнему открывается на главной', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'E2E Салон' })).toBeVisible()
})
