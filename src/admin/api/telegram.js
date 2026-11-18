import staffApi from './staffClient'

// { available, connected, remind_before, daily_summary } — бот настроен на сервере / Telegram этого сотрудника подключён
export async function fetchTelegramStatus() {
  const response = await staffApi.get('/telegram/')
  return response.data
}

// Одноразовая ссылка t.me для подключения (живёт 15 минут)
export async function createTelegramLink() {
  const response = await staffApi.post('/telegram/')
  return response.data.url
}

export async function disconnectTelegram() {
  await staffApi.delete('/telegram/')
}

// Напоминание мастеру за час до клиента и вечерняя сводка на завтра: { remind_before?, daily_summary? }
export async function updateTelegramSettings(data) {
  const response = await staffApi.patch('/telegram/', data)
  return response.data
}
