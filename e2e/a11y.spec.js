// Доступность (WCAG 2.1 A/AA, axe-core): контраст, подписи кнопок и полей, язык, структура.
// Серьёзные и критичные нарушения валят тест — их видят клиенты с экранными дикторами и плохим зрением.
import AxeBuilder from '@axe-core/playwright'
import { test, expect, pickDay, pickFirstSlot, staffLogin } from './fixtures'

async function audit(page, label) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const serious = result.violations.filter(v => ['serious', 'critical'].includes(v.impact))
  const report = serious.map(v => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`)
  expect(report, `доступность: ${label}`).toEqual([])
}

test('клиентский сайт: главная, шаги записи, кабинет, правила @desktop', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'E2E Салон' })).toBeVisible()
  await audit(page, 'главная')

  await page.getByRole('button', { name: /Выбрать услуги/ }).click()
  await expect(page.getByRole('button', { name: /Маникюр классический/ })).toBeVisible()
  await audit(page, 'услуги')
  await page.getByRole('button', { name: /Маникюр классический/ }).click()
  await page.getByRole('button', { name: 'Далее' }).click()
  await expect(page.getByRole('button', { name: /Анна/ })).toBeVisible()
  await audit(page, 'мастера')
  await page.getByRole('button', { name: /Анна/ }).click()
  await pickDay(page, 2)
  await expect(page.getByText('Свободное время')).toBeVisible()
  await audit(page, 'дата и время')
  await pickFirstSlot(page)
  await page.getByRole('button', { name: 'Далее' }).click()
  await expect(page.getByText('Проверьте детали записи')).toBeVisible()
  await audit(page, 'подтверждение')

  for (const [path, label] of [['/profile', 'вход'], ['/rules', 'правила'], ['/privacy', 'политика']]) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await audit(page, label)
  }
})

test('панель: вход и журнал @desktop', async ({ page }) => {
  await page.goto('/admin-panel/login')
  await audit(page, 'вход в панель')
  await staffLogin(page)
  await expect(page.getByRole('button', { name: 'Сегодня' })).toBeVisible()
  await audit(page, 'журнал')
  await page.goto('/admin-panel/debtors')
  await expect(page.getByText('Общий долг')).toBeVisible()
  await audit(page, 'должники')
})
