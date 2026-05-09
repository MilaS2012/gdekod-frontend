# Примеры подключения к Azure SQL Database

> **ВАЖНО:** все строки ниже — это шаблоны. Реальные пароли/ключи **никогда** не коммить в git. Храни их в:
> - **Локальная разработка:** `.env.local` (добавлен в `.gitignore`).
> - **Продакшен:** Azure Key Vault → переменные окружения Azure App Service / Container Apps.

## Где взять параметры

После создания Azure SQL Database в Azure Portal:

1. Перейди в свой SQL Server (не в БД, а в сервер).
2. Раздел **Settings → Connection strings**.
3. Там Azure уже сгенерировал готовые строки для ADO.NET, JDBC, ODBC, PHP — копируй нужную и подставляй пароль.

---

## ADO.NET / .NET (System.Data.SqlClient или Microsoft.Data.SqlClient)

```
Server=tcp:<YOUR_SERVER>.database.windows.net,1433;
Initial Catalog=gdekod;
Persist Security Info=False;
User ID=<YOUR_ADMIN_LOGIN>;
Password=<YOUR_PASSWORD>;
MultipleActiveResultSets=False;
Encrypt=True;
TrustServerCertificate=False;
Connection Timeout=30;
```

## Node.js (mssql / tedious)

```js
// .env.local
// AZURE_SQL_SERVER=<YOUR_SERVER>.database.windows.net
// AZURE_SQL_DATABASE=gdekod
// AZURE_SQL_USER=<YOUR_ADMIN_LOGIN>
// AZURE_SQL_PASSWORD=<YOUR_PASSWORD>

import sql from 'mssql';

const config = {
  server: process.env.AZURE_SQL_SERVER,
  database: process.env.AZURE_SQL_DATABASE,
  user: process.env.AZURE_SQL_USER,
  password: process.env.AZURE_SQL_PASSWORD,
  port: 1433,
  options: {
    encrypt: true,            // обязательно для Azure SQL
    trustServerCertificate: false,
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

const pool = await sql.connect(config);
const result = await pool.request().query('SELECT TOP 5 name, domain FROM dbo.merchants');
console.log(result.recordset);
```

## sqlcmd (CLI — для применения миграций)

```bash
# применить схему
sqlcmd -S <YOUR_SERVER>.database.windows.net \
       -d gdekod \
       -U <YOUR_ADMIN_LOGIN> \
       -P '<YOUR_PASSWORD>' \
       -i schema.sql

# применить сид
sqlcmd -S <YOUR_SERVER>.database.windows.net \
       -d gdekod \
       -U <YOUR_ADMIN_LOGIN> \
       -P '<YOUR_PASSWORD>' \
       -i seed.sql
```

## JDBC (Java/Kotlin)

```
jdbc:sqlserver://<YOUR_SERVER>.database.windows.net:1433;database=gdekod;user=<YOUR_ADMIN_LOGIN>@<YOUR_SERVER>;password=<YOUR_PASSWORD>;encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net;loginTimeout=30;
```

---

## Что подставить вместо плейсхолдеров

| Плейсхолдер | Где взять |
|---|---|
| `<YOUR_SERVER>` | Имя SQL Server из Azure Portal (без `.database.windows.net`). |
| `<YOUR_ADMIN_LOGIN>` | Server admin login, который ты задал при создании сервера. |
| `<YOUR_PASSWORD>` | Пароль от admin login. |
| `gdekod` | Имя БД, которое ты задашь при создании. Можешь выбрать другое — тогда поменяй и тут. |

## Чек-лист безопасности

- [ ] `.env.local` добавлен в `.gitignore`.
- [ ] В Azure SQL Server → **Firewalls** добавлен только нужный диапазон IP (не `0.0.0.0–255.255.255.255`!).
- [ ] Опция **Allow Azure services and resources to access this server** включена, только если приложение деплоится в Azure.
- [ ] Для прода — отдельный SQL-логин с правами только на нужную БД (не admin).
- [ ] `Encrypt=True` во всех строках подключения (Azure SQL не принимает незашифрованные соединения).
- [ ] Пароль ротируется через Azure Key Vault, а не лежит в репозитории.
