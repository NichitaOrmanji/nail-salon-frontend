// Доступность (WCAG 2.1 A/AA, axe-core): контраст, подписи кнопок и полей, язык, структура.
// Серьёзные и критичные нарушения валят тест — их видят клиенты с экранными дикторами и плохим зрением.
// Проверяется в каждой теме: «Море» светлая, «Море» тёмная и прежняя (classic) — src/theme.css.
import AxeBuilder from '@axe-core/playwright'
import { test, expect, pickDay, pickFirstSlot, staffLogin } from './fixtures'

async function audit(page, label) {
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  const serious = result.violations.filter(v => ['serious', 'critical'].includes(v.impact))
  const report = serious.map(v => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`)
  expect(report, `доступность: ${label}`).toEqual([])
}

// Тема задаётся до загрузки страницы — как выбор в меню панели (src/theme.js)
for (const theme of ['light', 'dark', 'classic']) {
  test.describe(`тема ${theme}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(value => { try { localStorage.setItem('ui-theme', value) } catch { /* нет хранилища */ } }, theme)
    })

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

    test('панель: вход, регистрация, журнал, начало работы @desktop', async ({ page }) => {
      await page.goto('/admin-panel/login')
      await audit(page, 'вход в панель')
      await page.goto('/admin-panel/signup')
      await expect(page.getByRole('button', { name: 'Создать салон' })).toBeVisible()
      await audit(page, 'регистрация салона')
      await page.goto('/admin-panel/forgot-password')
      await expect(page.getByRole('button', { name: 'Отправить ссылку' })).toBeVisible()
      await audit(page, 'забыли пароль')
      await staffLogin(page)
      await expect(page.getByRole('button', { name: 'Сегодня' })).toBeVisible()
      await audit(page, 'журнал')
      await page.goto('/admin-panel/debtors')
      await expect(page.getByText('Общий долг')).toBeVisible()
      await audit(page, 'должники')
      await page.goto('/admin-panel/start')
      await expect(page.getByRole('button', { name: 'Скопировать ссылку' })).toBeVisible()
      await audit(page, 'начало работы')
    })
  })
}
