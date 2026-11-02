import staffApi from './staffClient'

// Самостоятельная регистрация салона, подтверждение email, сброс пароля, чек-лист настройки

// { signup, password_reset, trial_days } — что открыто (зависит от настроек сервера)
export async function fetchSignupConfig() {
  const response = await staffApi.get('/signup/config/')
  return response.data
}

// { slug, available, error, suggestion } — по адресу или по названию салона
export async function checkSlug({ slug, name }) {
  const response = await staffApi.get('/signup/slug/', { params: slug ? { slug } : { name } })
  return response.data
}

// { access, refresh, me, email_sent }
export async function signup(data) {
  const response = await staffApi.post('/signup/', data)
  return response.data
}

// { verified, slug, public_url }
export async function verifyEmail(token) {
  const response = await staffApi.post('/verify-email/', { token })
  return response.data
}

export async function resendVerification() {
  const response = await staffApi.post('/verify-email/resend/')
  return response.data
}

export async function requestPasswordReset(email) {
  const response = await staffApi.post('/password-reset/', { email })
  return response.data
}

// { message, username }
export async function confirmPasswordReset({ uid, token, password }) {
  const response = await staffApi.post('/password-reset/confirm/', { uid, token, password })
  return response.data
}

// { steps: [{ key, done }], done, total, ready, public_url, status, trial_ends_at }
export async function fetchOnboarding() {
  const response = await staffApi.get('/onboarding/')
  return response.data
}
