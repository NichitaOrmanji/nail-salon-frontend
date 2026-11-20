import staffApi from './staffClient'

// Отзывы после визита: { enabled, summary: {average, count, requested, low}, masters, results }
export async function fetchReviews({ low = false } = {}) {
  const response = await staffApi.get('/reviews/', { params: low ? { low: 1 } : {} })
  return response.data
}
