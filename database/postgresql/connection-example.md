# Примеры подключения к Yandex Managed PostgreSQL

Шаблоны строк подключения для разных раннеров. **Реальных паролей и хостов в репозитории быть не должно** — здесь только плейсхолдеры. Где брать настоящие значения — внизу, в чек-листе безопасности.

Все примеры предполагают, что переменные окружения уже заполнены:

| Переменная | Откуда взять |
|---|---|
| `YANDEX_PG_HOST` | Кластер в YC → секция «Хосты» → FQDN мастера, например `rc1a-xxxxxxxx.mdb.yandexcloud.net`. |
| `YANDEX_PG_PORT` | По умолчанию `6432` (pgbouncer; рекомендуется для приложений) или `5432` (прямое подключение к PG). |
| `YANDEX_PG_USER` | Имя пользователя БД, созданного в кластере. |
| `YANDEX_PG_PASSWORD` | Пароль пользователя. **В прод/staging — только из Yandex Lockbox, не из `.env` в репо.** |
| `YANDEX_PG_DATABASE` | Имя базы (например, `gdekod`). |

CA-сертификат YC должен лежать на машине / в образе по пути `~/.postgresql/root.crt` (Linux/macOS) или указываться явно в коде клиента — см. примеры ниже.

```bash
mkdir -p ~/.postgresql
wget "https://storage.yandexcloud.net/cloud-certs/CA.pem" \
     -O ~/.postgresql/root.crt
chmod 0600 ~/.postgresql/root.crt
```

> Актуальный путь к сертификату проверяй в [документации Yandex Cloud](https://yandex.cloud/docs/managed-postgresql/operations/connect) — Яндекс периодически переименовывал bucket.

---

## 1. `psql` из терминала

С использованием переменных окружения и явного `sslmode=verify-full`:

```bash
export YANDEX_PG_HOST="rc1a-xxxxxxxx.mdb.yandexcloud.net"
export YANDEX_PG_PORT="6432"
export YANDEX_PG_USER="gdekod_admin"
export YANDEX_PG_PASSWORD="..."          # лучше через Lockbox или интерактивный ввод
export YANDEX_PG_DATABASE="gdekod"

PGPASSWORD="$YANDEX_PG_PASSWORD" psql \
    "host=$YANDEX_PG_HOST \
     port=$YANDEX_PG_PORT \
     dbname=$YANDEX_PG_DATABASE \
     user=$YANDEX_PG_USER \
     sslmode=verify-full \
     sslrootcert=$HOME/.postgresql/root.crt \
     target_session_attrs=read-write"
```

Что важно:

- `sslmode=verify-full` — проверяем и сертификат, и совпадение CN с хостом. Это самый строгий режим, он же — единственно безопасный для production.
- `target_session_attrs=read-write` — если мастер переедет на другой хост, клиент сам найдёт мастера в HA-кластере.
- `PGPASSWORD` передаётся как env только в рамках одной команды; в shell history попадёт сама команда, но не пароль (`$YANDEX_PG_PASSWORD` раскроется на лету).

Применить миграции через `psql`:

```bash
psql "host=$YANDEX_PG_HOST port=$YANDEX_PG_PORT dbname=$YANDEX_PG_DATABASE user=$YANDEX_PG_USER sslmode=verify-full" \
     -v ON_ERROR_STOP=1 \
     -f schema.sql

psql "host=$YANDEX_PG_HOST port=$YANDEX_PG_PORT dbname=$YANDEX_PG_DATABASE user=$YANDEX_PG_USER sslmode=verify-full" \
     -v ON_ERROR_STOP=1 \
     -f seed.sql
```

`ON_ERROR_STOP=1` — упасть на первой же ошибке, не выполнять оставшиеся statements.

---

## 2. Node.js — `pg` (node-postgres)

Самая распространённая библиотека. **Connection pool**, не одиночные клиенты — это важно для веб-приложения, которое получает много параллельных HTTP-запросов.

```bash
npm install pg
npm install --save-dev @types/pg   # для TypeScript
```

```js
// db.js
import fs from 'node:fs';
import { Pool } from 'pg';

const caCert = fs.readFileSync(
    process.env.YANDEX_PG_CA_PATH ?? `${process.env.HOME}/.postgresql/root.crt`,
    'utf8',
);

export const pool = new Pool({
    host:     process.env.YANDEX_PG_HOST,
    port:     Number(process.env.YANDEX_PG_PORT ?? 6432),
    user:     process.env.YANDEX_PG_USER,
    password: process.env.YANDEX_PG_PASSWORD,
    database: process.env.YANDEX_PG_DATABASE,
    ssl: {
        rejectUnauthorized: true,   // эквивалент sslmode=verify-full
        ca: caCert,
    },
    // Лимиты пула
    max: 10,                        // максимум соединений на инстанс приложения
    idleTimeoutMillis: 30_000,      // idle-соединение закрывается через 30 сек
    connectionTimeoutMillis: 5_000, // ждать подключения не дольше 5 сек
});

// Graceful shutdown — закрываем пул при остановке процесса.
process.on('SIGTERM', () => pool.end());
process.on('SIGINT',  () => pool.end());
```

Использование:

```js
import { pool } from './db.js';

const { rows } = await pool.query(
    'SELECT id, name, domain FROM merchants WHERE category = $1 ORDER BY name',
    ['eda'],
);
```

Что важно:

- `ssl.rejectUnauthorized: true` + явный `ca` — эквивалент `sslmode=verify-full`. Без `ca` Node будет искать в системном trust store, где CA Яндекса нет.
- Параметризованные запросы (`$1`, `$2`) — никогда не склеивать SQL строкой, это SQL-injection.
- `pool.end()` на shutdown — иначе process висит на открытых соединениях.

---

## 3. Node.js — `postgres` (Porsager)

Альтернатива `pg`: меньше зависимостей, шаблонные literals вместо `$1/$2`, в ~2× быстрее на бенчмарках. Хороша для serverless и edge-runtime.

```bash
npm install postgres
```

```js
// db.js
import fs from 'node:fs';
import postgres from 'postgres';

const caCert = fs.readFileSync(
    process.env.YANDEX_PG_CA_PATH ?? `${process.env.HOME}/.postgresql/root.crt`,
    'utf8',
);

export const sql = postgres({
    host:     process.env.YANDEX_PG_HOST,
    port:     Number(process.env.YANDEX_PG_PORT ?? 6432),
    username: process.env.YANDEX_PG_USER,
    password: process.env.YANDEX_PG_PASSWORD,
    database: process.env.YANDEX_PG_DATABASE,
    ssl: {
        rejectUnauthorized: true,
        ca: caCert,
    },
    max: 10,
    idle_timeout: 30,           // секунды (а не миллисекунды, как у pg)
    connect_timeout: 5,
});

process.on('SIGTERM', () => sql.end({ timeout: 5 }));
process.on('SIGINT',  () => sql.end({ timeout: 5 }));
```

Использование (шаблонные литералы автоматически параметризуются):

```js
import { sql } from './db.js';

const category = 'eda';
const merchants = await sql`
    SELECT id, name, domain
    FROM merchants
    WHERE category = ${category}
    ORDER BY name
`;
```

Когда выбирать `postgres` vs `pg`:

| Критерий | `pg` | `postgres` |
|---|---|---|
| Зрелость, документация | ⭐⭐⭐ | ⭐⭐ |
| Скорость | базовая | ~2× быстрее |
| Размер бандла | больше | меньше (важно для serverless) |
| API | callback/promise | tagged-template + promise |
| Совместимость с ORM (Prisma, Drizzle) | оба ORM умеют | оба ORM умеют |

Для Cloud Functions (см. ниже) `postgres` обычно удобнее: меньше cold-start.

---

## 4. Yandex Cloud Functions — особенности serverless

В serverless-runtime (Yandex Cloud Functions, аналог AWS Lambda) есть три специфичных проблемы при работе с БД:

1. **Cold start.** Создание TCP+TLS-соединения с PG занимает 100–500 мс. Делать это на каждый вызов функции — дорого.
2. **Параллельность.** Yandex Cloud масштабирует функцию горизонтально под нагрузку. Если каждая копия открывает по своему пулу на 10 соединений, легко упереться в `max_connections` PG (по умолчанию ~100 на small-кластере).
3. **Переменные окружения.** Их нельзя хранить в коде — нужны через **Yandex Lockbox** + интеграцию с функцией (mount как env-переменные).

### Паттерн: переиспользование клиента через global scope

Yandex Cloud (как и AWS Lambda) переиспользует контейнер функции между вызовами, пока он «тёплый». Глобальные переменные модуля **сохраняются** между вызовами одного контейнера. Используем это:

```js
// index.js — handler для Yandex Cloud Functions
import postgres from 'postgres';

// Глобальный singleton: создаётся один раз на cold-start, дальше переиспользуется.
let sql = null;

function getDb() {
    if (sql) return sql;

    sql = postgres({
        host:     process.env.YANDEX_PG_HOST,
        port:     Number(process.env.YANDEX_PG_PORT ?? 6432),
        username: process.env.YANDEX_PG_USER,
        password: process.env.YANDEX_PG_PASSWORD,   // приходит из Lockbox через env
        database: process.env.YANDEX_PG_DATABASE,
        ssl: {
            rejectUnauthorized: true,
            // CA в serverless удобнее не качать на диск, а вшить в код или
            // монтировать через ConfigMap/Lockbox secret. См. ниже.
            ca: process.env.YANDEX_PG_CA_CERT,
        },
        // serverless-настройки: пул минимальный
        max: 1,                  // одна функция = одно соединение
        idle_timeout: 5,         // быстро отпускаем idle, контейнер может умереть в любой момент
        connect_timeout: 3,
        max_lifetime: 60 * 5,    // принудительно пересоздавать соединение каждые 5 минут
    });

    return sql;
}

// Хендлер вызывается на каждый запрос. db создаётся 1 раз на cold-start.
export async function handler(event, context) {
    const db = getDb();

    const merchants = await db`
        SELECT id, name, domain
        FROM merchants
        WHERE is_active = true
        ORDER BY name
    `;

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merchants),
    };
}
```

Что важно:

- **`max: 1`** — у одной копии функции нет смысла держать больше одного соединения (она обрабатывает ровно один запрос за раз). Если масштабируется до 50 копий → 50 соединений в PG, что управляемо.
- **Подключаться через порт `6432` (pgbouncer)** — обязательно для serverless. PgBouncer мультиплексирует тысячи логических соединений в десятки физических, защищая PG от исчерпания `max_connections`.
- **`max_lifetime`** — принудительная ротация. Без неё «тёплый» контейнер может держать сломанное (например, после файловера PG) соединение часами.
- **CA-сертификат в serverless** — три варианта по удобству:
  1. Положить PEM-содержимое в Lockbox secret → монтировать как переменную окружения `YANDEX_PG_CA_CERT` (как в примере выше).
  2. Положить файл в репозиторий функции рядом с `index.js` и читать через `fs.readFileSync('./root.crt')`. Минус — сертификат лежит в коде, при ротации CA нужен ре-деплой.
  3. Скачать из bucket Object Storage на cold-start. Минус — лишний сетевой запрос, замедляет cold-start.

### Чего **не** делать в serverless

- **Не открывать соединение внутри `handler`** и не закрывать его в конце — это убивает весь смысл «тёплых» контейнеров и удваивает latency.
- **Не использовать `pool.end()` / `sql.end()`** в хендлере. Контейнер либо переиспользуется (тогда соединение нужно), либо умирает (тогда YC сам всё закроет).
- **Не качать CA-сертификат wget-ом на cold-start.** Кладёшь его в Lockbox или в код функции.

---

## Чек-лист безопасности

Перед тем как уйти в production:

- [ ] **Пароли и connection strings — только в Yandex Lockbox**, не в `.env`-файлах в репозитории. Lockbox-секрет монтируется как переменная окружения в Cloud Functions, в Container Registry-образах, в виртуалках.
- [ ] **`.env` и `.env.local` добавлены в `.gitignore`** на самом раннем этапе. Если `.env` уже попал в git history — его недостаточно удалить, нужно ротировать пароль и почистить историю (`git filter-repo`).
- [ ] **Подключение только через TLS** (`sslmode=verify-full` в psql, `ssl.rejectUnauthorized: true` + явный `ca` в Node). `sslmode=require` без `verify-full` уязвим к MITM — не использовать.
- [ ] **CA-сертификат YC** скачивается с `https://storage.yandexcloud.net/cloud-certs/CA.pem` — актуальный путь проверять в [документации YC](https://yandex.cloud/docs/managed-postgresql/operations/connect) (Яндекс периодически переименовывал bucket).
- [ ] **Service Account для production вместо паролей**, где возможно: для интеграций между сервисами YC (Cloud Functions → Managed PG в той же VPC) IAM-аутентификация по SA-токену безопаснее статических паролей. Для внешних клиентов и миграций пароль остаётся, но хранится в Lockbox.
- [ ] **Минимальные права у пользователя приложения.** Не использовать аккаунт `gdekod_admin` (с правами на DDL) из приложения. Завести отдельного `gdekod_app` с `SELECT, INSERT, UPDATE, DELETE` по нужным таблицам, без `CREATE`/`DROP`.
- [ ] **Whitelisting / VPC.** В продакшене не выставлять кластер в публичный интернет. Cloud Functions → Managed PG ходят внутри VPC, security group ограничивает доступ конкретным сервисам.
- [ ] **Rotation.** Пароль БД и CA-сертификат — оба периодически ротируются (раз в 90 дней по умолчанию для пароля). Lockbox версионирует секреты, Cloud Functions подтягивают новую версию автоматически при следующем cold-start.
