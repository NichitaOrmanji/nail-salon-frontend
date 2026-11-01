import { defineConfig, devices } from '@playwright/test'

// Браузерные тесты (e2e/). Нужны: бэкенд с салоном e2e (python manage.py e2e_seed) на :8000
// и сборка с VITE_DEFAULT_SALON=e2e. Как запускать — e2e/README.md, в CI — .github/workflows/e2e.yml
const CI = Boolean(process.env.CI)
const launchOptions = process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}

export default defineConfig({
  testDir: './e2e',
  // Тесты меняют общие данные салона (настройки, записи) — по одному
  workers: 1,
  fullyParallel: false,
  retries: CI ? 1 : 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5300',
    locale: 'ru-RU',
    // Как у салона и бэкенда: «сегодня» на сайте и на сервере совпадает
    timezoneId: 'Europe/Chisinau',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions,
  },
  projects: [
    { name: 'phone', use: { ...devices['Pixel 7'], browserName: 'chromium', viewport: { width: 390, height: 844 } } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 900 } }, grep: /@desktop/ },
  ],
  webServer: {
    command: 'node e2e/serve.mjs',
    url: 'http://localhost:5300',
    reuseExistingServer: !CI,
  },
})
