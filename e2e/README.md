# Браузерные тесты

Проверяют сайт записи и панель салона в настоящем браузере (Chromium, телефон 390px и компьютер),
вместе с настоящим бэкендом. В CI — `.github/workflows/e2e.yml` (на каждый PR здесь и в бэкенде).

Падение теста = что-то из этого сломалось: запись онлайн (оба пути), автоподтверждение,
«время уже заняли», вход в панель, оплата, неявка → чёрный список, удаление данных клиента,
права ролей, регистрация и удаление аккаунта, правила RU/RO, ширина страниц.
Любая ошибка JS, нарушение CSP или ответ сервера 5xx тоже валит тест (`fixtures.js`).

## Локально

```bash
# бэкенд (репозиторий online-registration-site)
python manage.py migrate && python manage.py createcachetable
python manage.py e2e_seed --password 'E2e-pass-2026!'   # пересоздаёт салон e2e
python manage.py runserver 127.0.0.1:8000

# здесь
VITE_DEFAULT_SALON=e2e npm run build
npm run test:e2e            # PW_CHROMIUM_PATH=… — если браузер Playwright установлен не стандартно
```

Перед повторным запуском снова выполните `e2e_seed`: тесты меняют данные салона.
При ошибке: `test-results/` — скриншот и trace (`npx playwright show-trace …/trace.zip`);
в CI — артефакт `e2e-report`.
