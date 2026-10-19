# Патчи для online-registration-site (этап 2: стабилизация)

Пять независимых патчей поверх `main` (673f86a). Применяются по порядку;
05 можно пропустить, если сервер устроен не так, как описано ниже.

| Патч | Что делает |
|---|---|
| 0001-migrations | Недостающая миграция `0010_missing_model_fields` (main_photo, Master.user, AdminProfile.company) |
| 0002-settings-security | DEBUG как булево, ALLOWED_HOSTS/CORS из .env, часовой пояс Europe/Chisinau, WhiteNoise через STORAGES, requirements.txt в UTF-8, .env.example |
| 0003-booking-validation | Единый расчёт свободного времени, проверка записи (график, занятость, прошлое, салон), «любой мастер», блокировка от двойной записи, мастера/услуги только своего салона и активные, тесты |
| 0004-account-reviews | «Мои записи» без 500, отмена (опечатка, прошедшие), отзывы (1–5, после визита, повтор = 400), тесты |
| 0005-deploy-gunicorn | gunicorn вместо runserver, migrate + collectstatic при старте, деплой пересобирает контейнер |

## Как применить

```bash
cd online-registration-site
git checkout main && git pull
git checkout -b stabilize
git am /путь/к/backend-patches/*.patch
python manage.py test bookings   # 24 теста должны пройти
git push -u origin stabilize     # и открыть PR
```

Если `git am` остановился на конфликте: `git am --abort` и напишите мне,
какой патч не лёг — пересоберу под текущий `main`.

## ⚠️ Перед выкаткой на сервер

1. **Миграции.** Проверьте на сервере `python manage.py showmigrations bookings`.
   - Если последняя — `0009_adminprofile`: просто `migrate` (в патче 05 это делается автоматически).
   - Если на сервере уже есть своя `0010_...` (кто-то запускал `makemigrations` прямо там) и колонки
     уже созданы: удалите серверный файл миграции и выполните
     `python manage.py migrate bookings 0010 --fake`.
2. **.env на сервере** — после патча 02 обязательно добавить:
   ```
   DEBUG=False
   ALLOWED_HOSTS=<домен или IP сервера>
   CORS_ALLOWED_ORIGINS=<адрес фронтенда, например https://jcnails.md>
   ```
   Без них при DEBUG=False сервер ответит 400 (Bad Request), а фронт получит ошибку CORS.
3. **DEBUG раньше был включён всегда.** После патча, если в .env стоит `DEBUG=False`, он
   действительно выключится — статика админки тогда отдаётся только после `collectstatic`
   (патч 05 делает это при старте контейнера).
4. **Патч 05** рассчитан на то, что сервер запускает проект через `docker compose`
   (как в docker-compose.yml). Если деплой устроен иначе — не применяйте его, напишите как,
   подстрою.
