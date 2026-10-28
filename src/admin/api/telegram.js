import staffApi from './staffClient'

// { available, connected } — бот настроен на сервере / Telegram этого сотрудника подключён
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
