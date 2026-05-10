# Деплой ГдеКод на Yandex Object Storage + CDN

Скрипты для переноса фронта `gde-code.ru` с Azure Static Web Apps на Yandex Cloud. Сейчас всё подготовлено локально — реальный запуск возможен после верификации платёжного аккаунта ООО «ЭЛУССО» в Yandex Cloud.

## Что делает каждый скрипт

| Файл | Когда запускать | Что делает |
|---|---|---|
| `build.sh` | Перед деплоем (или авто из `deploy-yandex.sh`). | `npm run build` + sanity-check: что `dist/` создалась, есть `index.html`, размер адекватный. |
| `setup-bucket.sh` | **Один раз** при первом деплое. | Создаёт bucket, открывает публичный read, включает static website hosting (`index.html`), настраивает CORS под домены `gde-code.ru` / `www.gde-code.ru`. Идемпотентен: повторный запуск ничего не сломает. |
| `deploy-yandex.sh` | Каждый раз, когда нужно выкатить новую версию. | Билдит, заливает `dist/` в bucket с правильными `Cache-Control`, опционально инвалидирует CDN. |
| `.env.example` | Скопировать в `.env` при первой настройке. | Шаблон переменных окружения. Реальный `.env` — в `.gitignore`. |

## Переменные окружения

Скрипты читают `deploy/.env` (если есть), либо берут переменные из текущего шелла. Минимально нужны:

| Переменная | Откуда взять | Обязательна? |
|---|---|---|
| `YC_FOLDER_ID` | `yc resource-manager folder list` → колонка `ID` (`b1g...`). | Да |
| `YC_BUCKET_NAME` | Придумать. Глобально уникальное в YC, только `[a-z0-9.-]`. У нас — `gdekod-frontend`. | Да |
| `YC_CDN_RESOURCE_ID` | После создания CDN-ресурса: `yc cdn resource list` → колонка `ID`. | Нет (если пусто — инвалидация кеша пропустится). |
| `YC_TOKEN` | OAuth-токен. Для локального использования проще `yc init` — тогда токен не нужен. В CI — обязательно через secrets. | Нет, если `yc` уже настроен через `yc init`. |

## Порядок запуска

### Первый раз (когда YC разблокируется)

```bash
# 0. Установить yc CLI (если ещё не стоит):
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
source "$HOME/yandex-cloud/path.bash.inc"
yc init                        # выбрать аккаунт, каталог, облако

# 1. Заполнить .env:
cp deploy/.env.example deploy/.env
# отредактировать deploy/.env, проставить YC_FOLDER_ID и YC_BUCKET_NAME

# 2. Создать и настроить bucket:
./deploy/setup-bucket.sh

# 3. Первый деплой:
./deploy/deploy-yandex.sh

# 4. Проверить, что сайт открывается по прямому URL:
#    https://<YC_BUCKET_NAME>.website.yandexcloud.net/

# 5. Создать CDN-ресурс в консоли YC (см. setup-bucket.sh, секцию «Что делать дальше»).
# 6. Прописать YC_CDN_RESOURCE_ID в deploy/.env.
# 7. Перенаправить DNS gde-code.ru с Azure на Yandex CDN (см. ниже).
```

### Все последующие деплои

```bash
./deploy/deploy-yandex.sh
```

Один скрипт делает всё: билд → загрузка в bucket → инвалидация CDN.

Флаги:
- `--skip-build` — использовать уже существующий `dist/`, не пересобирать.

## Чек-лист подготовки к первому деплою

Прежде чем запускать `setup-bucket.sh`:

- [ ] Платёжный аккаунт ООО «ЭЛУССО» в Yandex Cloud верифицирован.
- [ ] Создано облако и каталог в YC. ID каталога знаешь (`b1g...`).
- [ ] `yc CLI` установлен, `yc init` пройден, `yc config list` показывает активный профиль.
- [ ] `deploy/.env` создан из `deploy/.env.example`, заполнены `YC_FOLDER_ID` и `YC_BUCKET_NAME`.
- [ ] У IAM-аккаунта (того, что в активном yc-профиле) есть роль `storage.editor` на каталоге.
- [ ] Локальная сборка работает: `npm run build` отрабатывает без ошибок, в `dist/` появляются `index.html` и `assets/`.

## После первого деплоя — переключение DNS

Сейчас `gde-code.ru` указывает на Azure Static Web Apps. Чтобы переключиться на Yandex:

1. **В консоли YC создать CDN-ресурс**, привязанный к bucket:
   - Origin: bucket `gdekod-frontend`.
   - Personal domains: `gde-code.ru`, `www.gde-code.ru`.
   - HTTPS: включить (YC выпустит Let's Encrypt сертификат автоматически после прохождения DNS-валидации).
   - Forward Host header: `custom` → `gde-code.ru`.
   - Cache TTL: **не переопределять**, использовать `Cache-Control` от origin (наши значения мы выставили в `deploy-yandex.sh`).
2. После создания YC покажет CNAME-эндпоинт ресурса вида `cl-xxxxxxxxxxxx.edgecdn.ru`.
3. **В Cloudflare DNS** (там сейчас живёт зона `gde-code.ru`):
   ```
   тип: CNAME    имя: gde-code.ru        значение: cl-xxxxxxxx.edgecdn.ru   proxy: DNS only (серая туча)
   тип: CNAME    имя: www.gde-code.ru    значение: cl-xxxxxxxx.edgecdn.ru   proxy: DNS only (серая туча)
   ```
   **Важно:** proxy (оранжевая туча) — выключить. Yandex CDN сам терминирует TLS и выпускает сертификат — двойной CDN не нужен и сломает Let's Encrypt-валидацию.
4. Подождать 5–60 минут, пока DNS пропагируется.
5. Открыть `https://gde-code.ru` — должен появиться фронт с Yandex.
6. В консоли YC проверить, что CDN-ресурс перешёл в статус `active`, сертификат `issued`.
7. Прописать `YC_CDN_RESOURCE_ID` в `deploy/.env`. Следующий `deploy-yandex.sh` уже будет инвалидировать кеш.

## Откат, если что-то пошло не так

Azure Static Web Apps **не отключаем** до тех пор, пока Yandex не отработает 1–2 недели стабильно.

### Сценарий 1. После переключения DNS сайт не открывается на Yandex

Самое быстрое — вернуть DNS обратно:

1. В Cloudflare для `gde-code.ru` и `www.gde-code.ru` поставить CNAME обратно на Azure SWA-эндпоинт (вида `<...>.azurestaticapps.net`), proxy включить как было.
2. TTL DNS-записей мы заранее снижаем до 300 секунд за сутки до миграции — обратное переключение тоже произойдёт за 5 минут.
3. Разбираться с Yandex без давления — пользователи на Azure.

### Сценарий 2. Yandex отдаёт неактуальные файлы (старая версия после деплоя)

Это всегда вопрос кеша. Проверить по уровням:

1. **Бот-кеш браузера:** открыть в режиме инкогнито или с `Cmd+Shift+R`. Если в инкогнито свежак — проблема только в браузере одного юзера, не системная.
2. **CDN-кеш:** если `YC_CDN_RESOURCE_ID` задан — `deploy-yandex.sh` уже его инвалидирует. Если нет — вручную:
   ```bash
   yc cdn cache purge --resource-id <ID> --path "/index.html" --path "/"
   ```
3. **Origin (bucket):** проверить через прямой URL `https://<bucket>.website.yandexcloud.net/index.html` — если там старое, значит загрузка не прошла. Перезапустить `deploy-yandex.sh`.

### Сценарий 3. Случайно удалили bucket или повредили его настройки

```bash
# Bucket пересоздаётся:
./deploy/setup-bucket.sh

# Контент перезаливается:
./deploy/deploy-yandex.sh
```

Состояние в bucket не критичное — это собранный фронт, источник правды (исходники) в git.

## Что НЕ делает этот деплой

- **Не работает с базой данных** — миграции PG лежат в `database/postgresql/` и применяются отдельно (см. `database/postgresql/README.md`).
- **Не разворачивает backend** — у нас пока его нет (фронт — статический SPA + публичная Managed PG позже через REST или Cloud Functions).
- **Не настраивает мониторинг и алерты** — это отдельный этап после стабилизации деплоя.
- **Не настраивает CI/CD** — пока ручной запуск с локальной машины. GitHub Actions с секретами появятся, когда команда будет больше одного человека.
