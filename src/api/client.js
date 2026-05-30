import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
})

// Перехватчик ошибок — срабатывает на любой неудачный запрос
api.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      // Нет соединения с сервером
      return Promise.reject(new Error('Нет соединения с сервером. Проверьте интернет.'))
    }

    const status = error.response.status

    if (status === 400) {
      return Promise.reject(new Error('Неверные данные. Проверьте заполненные поля.'))
    }
    if (status === 404) {
      return Promise.reject(new Error('Данные не найдены.'))
    }
    if (status >= 500) {
      return Promise.reject(new Error('Ошибка сервера. Попробуйте позже.'))
    }

    return Promise.reject(new Error('Что-то пошло не так. Попробуйте ещё раз.'))
  }
)

export const SLUG = 'test-salon'

export default api