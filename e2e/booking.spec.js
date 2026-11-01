// Клиентский сайт: запись онлайн всеми путями, автоподтверждение, «время уже заняли».
import {
  test, expect, uniquePhone, pickDay, pickFirstSlot, fillAndBook, staffLogin, openJournalDay, setAutoConfirm, SALON,
} from './fixtures'

test.afterEach(async ({ request }) => {
  await setAutoConfirm(request, false)
})

test('услуга → мастер → время: запись ждёт подтверждения салона и видна в журнале @desktop', async ({ page, request }) => {
  await setAutoConfirm(request, false)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'E2E Салон' })).toBeVisible()
  await page.getByRole('button', { name: /Выбрать услуги/ }).click()
  await page.getByRole('button', { name: /Маникюр классический/ }).click()
  await page.getByRole('button', { name: 'Далее' }).click()
  await page.getByRole('button', { name: /Анна/ }).click()
  await pickDay(page, 2)
  await pickFirstSlot(page)
  await page.getByRole('button', { name: 'Далее' }).click()

  const name = `Сайт ${Date.now() % 100000}`
  await fillAndBook(page, { name, phone: uniquePhone() })
  await expect(page.getByRole('heading', { name: 'Вы записаны' })).toBeVisible()
  await expect(page.getByText('Салон подтвердит запись')).toBeVisible()

  await staffLogin(page)
  await openJournalDay(page, 2)
  await expect(page.getByTitle(new RegExp(name)).first()).toBeVisible()
})

test('дата и время → услуга → мастер: с автоподтверждением запись подтверждена сразу', async ({ page }) => {
  // Галочка в настройках — через панель, как это сделает владелец
  await staffLogin(page)
  await page.goto('/admin-panel/settings')
  await page.getByLabel('Подтверждать онлайн-записи автоматически').check()
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page.getByText('Сохранено')).toBeVisible()

  await page.goto('/')
  await page.getByRole('button', { name: /Выбрать дату и время/ }).click()
  await pickDay(page, 3)
  await pickFirstSlot(page)
  await page.getByRole('button', { name: 'Далее' }).click()
  await expect(page.getByText('Доступные в выбранное время')).toBeVisible()
  await page.getByRole('button', { name: /Педикюр/ }).click()
  await page.getByRole('button', { name: 'Далее' }).click()
  await page.getByRole('button', { name: /Мария/ }).click()

  await fillAndBook(page, { name: 'Авто Подтверждение', phone: uniquePhone() })
  await expect(page.getByRole('heading', { name: 'Запись подтверждена' })).toBeVisible()
})

test('время заняли, пока клиент заполнял форму — понятная ошибка, запись не создана', async ({ page, request }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Выбрать услуги/ }).click()
  await page.getByRole('button', { name: /Маникюр классический/ }).click()
  await page.getByRole('button', { name: 'Далее' }).click()
  await page.getByRole('button', { name: /Мария/ }).click()
  await pickDay(page, 4)
  await pickFirstSlot(page)
  await page.getByRole('button', { name: 'Далее' }).click()
  await expect(page.getByText('Проверьте детали записи')).toBeVisible()

  // Другой клиент успевает занять это время
  const chosen = await page.evaluate(() => JSON.parse(sessionStorage.getItem('booking')))
  const taken = await request.post(`/api/companies/${SALON}/appointments/`, {
    data: {
      master: chosen.master.id, service: chosen.service.id, date: chosen.date, start_time: chosen.time,
      client_name: 'Успел Первым', client_phone: '+373' + uniquePhone(), consent: true,
    },
  })
  expect(taken.status()).toBe(201)

  await fillAndBook(page, { name: 'Опоздал', phone: uniquePhone() })
  await expect(page.getByText(/время недоступно|уже заняли/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Вы записаны' })).toHaveCount(0)
})
