// Страница продукта: кнопка «Начать работу» ведёт на регистрацию салона; доступность.
import AxeBuilder from '@axe-core/playwright'
import { test, expect } from './fixtures'

test('лендинг: «Начать работу» → регистрация салона, доступность @desktop', async ({ page }) => {
  await page.goto('/welcome')
  await expect(page.getByRole('heading', { level: 1, name: 'Онлайн-запись для салона красоты' })).toBeVisible()
  await expect(page.getByText('14 дней бесплатно').first()).toBeVisible()

  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const serious = result.violations.filter(v => ['serious', 'critical'].includes(v.impact))
  expect(serious.map(v => `${v.id}: ${v.help}`), 'доступность: лендинг').toEqual([])

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
