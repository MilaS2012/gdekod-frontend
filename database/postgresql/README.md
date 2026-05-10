# База данных ГдеКод (PostgreSQL)

PostgreSQL-версия схемы и сид-данных для каталога магазинов и промокодов ГдеКод. Целевая платформа — **Yandex Managed Service for PostgreSQL 15+**. Персональных данных пользователей здесь нет — только публичный каталог партнёров и сами промокоды.

> Параллельно в `../` лежит T-SQL-версия для Azure SQL Database. Эта папка — самостоятельная альтернатива, не патч поверх неё.

## Содержимое папки

| Файл | Что делает |
|---|---|
| `schema.sql` | Создаёт ENUM `coupon_status`, все таблицы, индексы и ограничения. Запускается один раз при первом развёртывании БД. Скрипт идемпотентный: каждый объект создаётся только если его ещё нет (`CREATE TABLE IF NOT EXISTS`, `DO $$ ... IF NOT EXISTS (SELECT 1 FROM pg_type ...)`). |
| `seed.sql` | Заполняет БД тестовыми данными: 6 категорий, 15 магазинов, 30 промокодов. Идемпотентный — использует `INSERT ... ON CONFLICT DO UPDATE` (PG-эквивалент T-SQL `MERGE`). |
| `README.md` | Этот файл. |

## Как подключиться

1. В консоли Yandex Cloud создай **Managed Service for PostgreSQL** → кластер с PG 15+.
2. Создай базу (например, `gdekod`) и пользователя-владельца.
3. Включи публичный доступ к хосту (на dev-окружении) или настрой security group / VPC для прод-доступа.
4. Скачай SSL-сертификат YC: `mkdir -p ~/.postgresql && wget "https://storage.yandexcloud.net/cloud-certs/CA.pem" -O ~/.postgresql/root.crt && chmod 0600 ~/.postgresql/root.crt`.
5. Подключись:

```bash
psql "host=rc1a-xxxxx.mdb.yandexcloud.net \
      port=6432 \
      sslmode=verify-full \
      dbname=gdekod \
      user=gdekod_admin"
```

Параметры подключения (host, порт, режим SSL) видны на странице кластера в консоли YC.

## Как применить миграции

Порядок строго такой: сначала схема, потом сид.

### Локально через `psql`

```bash
# из папки database/postgresql/
psql "host=rc1a-xxxxx.mdb.yandexcloud.net port=6432 sslmode=verify-full dbname=gdekod user=gdekod_admin" \
  -f schema.sql

psql "host=rc1a-xxxxx.mdb.yandexcloud.net port=6432 sslmode=verify-full dbname=gdekod user=gdekod_admin" \
  -f seed.sql
```

Проверка:

```sql
SELECT COUNT(*) FROM merchants;       -- должно быть 15
SELECT COUNT(*) FROM coupons;         -- должно быть 30
SELECT COUNT(*) FROM categories;      -- должно быть 6
SELECT unnest(enum_range(NULL::coupon_status));  -- 4 значения ENUM
```

### Через консоль Yandex Cloud

1. Кластер → вкладка **SQL** → выбрать БД `gdekod`.
2. Вставить содержимое `schema.sql` → **Выполнить**.
3. Затем вставить содержимое `seed.sql` → **Выполнить**.

Команда `\echo` в конце `seed.sql` в веб-консоли игнорируется (это psql-meta-команда) — это нормально, ошибки не будет.

> **Идемпотентность:** оба скрипта можно запускать повторно. `schema.sql` ничего не пересоздаёт, `seed.sql` обновляет уже существующие строки через `ON CONFLICT DO UPDATE`. Данные не задвоятся.

---

## Описание таблиц

### `categories` — справочник категорий

Маленькая lookup-таблица для категорий магазинов. Берётся из фронта (вкладки «Еда», «Одежда», «Электроника» и т.д.).

| Поле | Тип | Описание |
|---|---|---|
| `id` | `INTEGER` PK, `GENERATED ALWAYS AS IDENTITY` | Автоинкремент. Нельзя случайно вставить вручную. |
| `key` | `VARCHAR(32)` UNIQUE | Машинный ключ: `eda`, `odezhda`, `elektronika`, `travel`, `krasota`, `other`. Используется на фронте и в `merchants.category`. Колонка в кавычках (`"key"`), т.к. `KEY` — keyword в SQL-стандарте. |
| `label_ru` | `VARCHAR(64)` | Подпись для пользователя: «Еда и продукты», «Одежда и обувь» и т.д. |
| `sort_order` | `INTEGER` DEFAULT `100` | Порядок отображения вкладок (меньше — раньше). |

### `merchants` — магазины-партнёры

Каталог магазинов: Wildberries, Ozon, Авиасейлс и т.д.

| Поле | Тип | Описание |
|---|---|---|
| `id` | `BIGINT` PK, `GENERATED ALWAYS AS IDENTITY` | Автоинкремент. |
| `name` | `VARCHAR(128)` | Название магазина для UI («Wildberries», «М.Видео»). |
| `domain` | `VARCHAR(255)` UNIQUE | Основной домен (`wildberries.ru`). По нему делаем поиск и сопоставление при автопроверке. **Уникален** — один домен = один магазин. UNIQUE-констрейнт автоматически создаёт индекс — отдельный non-unique не нужен. |
| `category` | `VARCHAR(32)` FK → `categories.key` | К какой категории относится магазин. |
| `logo_url` | `VARCHAR(512)` NULL | Ссылка на логотип. Пока `NULL` для всех — заполним позже. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` DEFAULT `NOW()` | Когда добавили в БД. PG хранит TIMESTAMPTZ внутри как UTC; отображение зависит от сессионной TZ. |
| `is_active` | `BOOLEAN` DEFAULT `TRUE` | `TRUE` — показываем в каталоге. `FALSE` — скрыли (магазин ушёл из партнёров, но удалять жалко из-за истории). |

### `coupons` — промокоды

Главная таблица. Каждая строка — один действующий или когда-то действовавший промокод.

| Поле | Тип | Описание |
|---|---|---|
| `id` | `BIGINT` PK, `GENERATED ALWAYS AS IDENTITY` | Автоинкремент. |
| `merchant_id` | `BIGINT` FK → `merchants.id` | К какому магазину относится. `ON DELETE CASCADE` — при удалении магазина каскадно удаляются его промокоды. |
| `code` | `VARCHAR(64)` | Сам промокод (то, что юзер копирует и вставляет на сайте магазина): `WB500RUB`, `OZON10NEW`. |
| `discount` | `VARCHAR(64)` | Короткое отображение скидки для UI: `−500 ₽`, `−15%`. Хранится строкой намеренно — у магазинов скидки разной природы (фикс, процент, бесплатная доставка), парсить в число пока бессмысленно. |
| `description` | `VARCHAR(512)` | Условия применения: «На заказ от 3 000 ₽», «Только для новых». |
| `expires_at` | `TIMESTAMP WITH TIME ZONE` NULL | Когда истекает. **`NULL` = бессрочный** (пока магазин сам не отзовёт). |
| `last_checked_at` | `TIMESTAMP WITH TIME ZONE` NULL | Когда автопроверка последний раз убедилась, что код жив. `NULL` = ещё не проверяли. |
| `status` | `coupon_status` ENUM DEFAULT `'active'` | Жизненный цикл (см. ниже). Native ENUM вместо CHECK CONSTRAINT — подробнее в разделе «Отличия от T-SQL». |
| `verified_text` | `VARCHAR(64)` NULL | Человекочитаемая «свежесть» проверки для UI: `2 ч`, `5 ч`. Денормализация — храним готовую строку, чтобы не вычислять на каждый рендер. Пересчитывается раз в N минут вместе с автопроверкой. |
| `created_at` | `TIMESTAMP WITH TIME ZONE` DEFAULT `NOW()` | Когда добавили промокод в БД. |

**Уникальность:** `(merchant_id, code)` — один и тот же код у одного магазина не задваивается. Используется как target в `ON CONFLICT` при сидовании.

**Индексы:**
- `ix_coupons_merchant_id` — список промокодов конкретного магазина.
- `ix_coupons_status` — фильтр «только активные» в каталоге.
- `ix_coupons_expires_at` — найти всё, что истекает скоро (для воркера-чекера).

### `coupon_checks` — история автопроверок

Append-only лог: каждая попытка автопроверки промокода — отдельная строка. Никогда не апдейтится, только вставляется. Нужен для:
- отладки («почему вы решили, что код не работает?»),
- статистики качества автопроверки,
- ручного разбора `needs_manual_check`.

| Поле | Тип | Описание |
|---|---|---|
| `id` | `BIGINT` PK, `GENERATED ALWAYS AS IDENTITY` | Автоинкремент. |
| `coupon_id` | `BIGINT` FK → `coupons.id` | Какой промокод проверяли. `ON DELETE CASCADE` — если удалили промокод, удаляем и его историю. |
| `checked_at` | `TIMESTAMP WITH TIME ZONE` DEFAULT `NOW()` | Момент проверки. |
| `result` | `coupon_status` ENUM | Что чекер «увидел» в этот раз. **Тот же ENUM, что у `coupons.status`** — четыре допустимых значения хранятся в одном месте. |
| `raw_response_text` | `TEXT` NULL | Сырой ответ от чекера/скрейпера (HTML-фрагмент, JSON, текст ошибки). Для разбора инцидентов. PG-эквивалент `NVARCHAR(MAX)`. |

**Индекс:** `ix_coupon_checks_coupon_id (coupon_id, checked_at DESC)` — быстро получить «последние N проверок этого промокода».

### ENUM `coupon_status`

Тип-перечисление, переиспользуется и в `coupons.status`, и в `coupon_checks.result`:

| Значение | Когда |
|---|---|
| `active` | Промокод работает, показываем юзеру. |
| `expired` | Прошла дата `expires_at` или автопроверка вернула «не работает по причине срока». |
| `needs_manual_check` | Автопроверка не смогла однозначно определить — нужен глаз человека. |
| `removed` | Магазин убрал промокод. **Soft-delete:** строку не удаляем, чтобы не ломать историю в `coupon_checks`. |

Добавить новое значение можно через `ALTER TYPE coupon_status ADD VALUE 'новое'`. Удалить значение из ENUM в PG нельзя без пересоздания типа — учитывайте это при будущих изменениях.

---

## Связь с фронтом

Источник данных для сида — массив `PARTNERS` и его поле `coupons` из `legacy/gdekod-lk.html`. Перенос пошёл так:

| Что во фронте | Что в БД |
|---|---|
| Вкладки фильтра вверху каталога: «Еда», «Одежда», «Электроника», «Путешествия», «Красота», «Прочее» | 6 строк в `categories` (`key` совпадает с машинным значением вкладки на фронте). |
| Каждый элемент массива `PARTNERS`: `name`, `domain`, `category` | 1 строка в `merchants`. Поле `category` — string-FK на `categories.key` (а не на `categories.id`), чтобы фронту и БД не приходилось делать лишний join по id. |
| Каждый элемент `partner.coupons[i]`: `code`, `discount`, `description`, опциональный `expiresAt`, `verifiedText` | 1 строка в `coupons`. Поле `merchant_id` резолвится в seed по domain — порядок IDENTITY-значений значения не имеет. |

То, чего на фронте нет (`status`, `last_checked_at`, `coupon_checks`) — это серверная сторона: жизненный цикл промокода и история автопроверки. На фронте показывается только «свежесть» проверки (`verified_text`), посчитанная сервером.

---

## Отличия от T-SQL-версии

Сводка для тех, кто переключается между папками `database/` (T-SQL) и `database/postgresql/`:

| T-SQL (Azure SQL) | PostgreSQL | Зачем |
|---|---|---|
| `IDENTITY(1,1)` | `GENERATED ALWAYS AS IDENTITY` | SQL-стандарт; нельзя случайно вставить значение в id. |
| `INT` / `BIGINT` | `INTEGER` / `BIGINT` | То же самое. |
| `NVARCHAR(N)` | `VARCHAR(N)` | В PG строки уже Unicode, отдельный «N»-тип не нужен. |
| `NVARCHAR(MAX)` | `TEXT` | Для безразмерных строк (`raw_response_text`). |
| `BIT` | `BOOLEAN` | Native bool вместо 0/1. |
| `DATETIME2(0)` | `TIMESTAMP WITH TIME ZONE` | TIMESTAMPTZ хранит абсолютное время в UTC и отдаёт в нужной TZ. |
| `SYSUTCDATETIME()` | `NOW()` | Для TIMESTAMPTZ-колонки `NOW()` возвращает UTC-момент; явный `AT TIME ZONE 'UTC'` избыточен. |
| `CHECK (status IN (...))` | ENUM `coupon_status` | Native PG-перечисление: компактнее на диске (4 байта vs строка), типобезопасно, IDE подсказывает значения. Минус — добавлять значения через `ALTER TYPE`, удалять нельзя. |
| `IF OBJECT_ID(...) IS NULL` | `CREATE TABLE IF NOT EXISTS` | Идиоматичная PG-идемпотентность одной строкой. |
| `IF NOT EXISTS (SELECT 1 FROM sys.indexes ...)` | `CREATE INDEX IF NOT EXISTS` | Аналогично. |
| `MERGE` (T-SQL) | `INSERT ... ON CONFLICT DO UPDATE` | PG-апсёрт. Привязан к UNIQUE-констрейнту в target-таблице. |
| `[key]` (квадратные скобки) | `"key"` (двойные кавычки) | PG не понимает квадратные скобки; для зарезервированных идентификаторов — двойные кавычки. |
| схема `dbo` | схема `public` | Дефолт PG; `dbo` в PG не существует. |
| `GO` | `;` | PG не использует разделитель батчей; каждое statement через `;`. |

---

## Что НЕ в этой БД

Чтобы не было путаницы:

- **Пользователи, авторизация, сессии** — в этой схеме их нет. Для каталога+промокодов они не нужны. Когда появятся профиль/избранное/история — это будет отдельная миграция (новые таблицы `users`, `user_favorites`).
- **Логи фронта, метрики, аналитика** — это не задача SQL, они идут в Yandex Cloud Logging / Yandex Monitoring.
- **Файлы (логотипы)** — в БД храним только ссылку (`merchants.logo_url`); сами файлы лежат в Yandex Object Storage.

## Соглашения

- **Все названия — на английском** (стандарт). Описание в этом README и комментарии в `seed.sql` — на русском.
- **Время — всегда UTC** на уровне записи (`NOW()` для TIMESTAMPTZ), конвертация в локальную TZ — на фронте.
- **Стандарт PostgreSQL 15+** для Yandex Managed PG. Назад на T-SQL/MySQL переносить нельзя без правок (ENUM-тип, `GENERATED AS IDENTITY` в этом синтаксисе, `ON CONFLICT`, `TIMESTAMPTZ` — это PG-специфика).
