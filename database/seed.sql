-- =============================================================================
-- GdeKod — тестовые данные (seed)
-- Заполняет таблицы categories, merchants, coupons на основе массива PARTNERS
-- из legacy/gdekod-lk.html.
-- =============================================================================
-- Скрипт идемпотентный: можно перезапускать. Использует MERGE, чтобы не
-- задваивать строки при повторном запуске.
-- =============================================================================

SET NOCOUNT ON;
GO

-- -----------------------------------------------------------------------------
-- 1. Категории (6 штук, как в фронте)
-- -----------------------------------------------------------------------------
MERGE dbo.categories AS target
USING (VALUES
    (N'eda',          N'Еда и продукты',  10),
    (N'odezhda',      N'Одежда и обувь',  20),
    (N'elektronika',  N'Электроника',     30),
    (N'travel',       N'Путешествия',     40),
    (N'krasota',      N'Красота',         50),
    (N'other',        N'Прочее',          60)
) AS source ([key], label_ru, sort_order)
ON target.[key] = source.[key]
WHEN MATCHED THEN
    UPDATE SET label_ru = source.label_ru, sort_order = source.sort_order
WHEN NOT MATCHED BY TARGET THEN
    INSERT ([key], label_ru, sort_order) VALUES (source.[key], source.label_ru, source.sort_order);
GO

-- -----------------------------------------------------------------------------
-- 2. Магазины (15 штук — из массива PARTNERS)
-- -----------------------------------------------------------------------------
MERGE dbo.merchants AS target
USING (VALUES
    -- name              | domain               | category
    (N'Авиасейлс',         N'aviasales.ru',       N'travel'),
    (N'AliExpress',        N'aliexpress.ru',      N'elektronika'),
    (N'билайн',            N'beeline.ru',         N'other'),
    (N'Wildberries',       N'wildberries.ru',     N'odezhda'),
    (N'DNS',               N'dns-shop.ru',        N'elektronika'),
    (N'Delivery Club',     N'delivery-club.ru',   N'eda'),
    (N'Золотое Яблоко',    N'goldapple.ru',       N'krasota'),
    (N'Zara',              N'zara.com',           N'odezhda'),
    (N'Ситилинк',          N'citilink.ru',        N'elektronika'),
    (N'Самокат',           N'samokat.ru',         N'eda'),
    (N'Lamoda',            N'lamoda.ru',          N'odezhda'),
    (N'М.Видео',           N'mvideo.ru',          N'elektronika'),
    (N'Ozon',              N'ozon.ru',            N'other'),
    (N'Яндекс Еда',        N'eda.yandex.ru',      N'eda'),
    (N'Яндекс Маркет',     N'market.yandex.ru',   N'other')
) AS source (name, domain, category)
ON target.domain = source.domain
WHEN MATCHED THEN
    UPDATE SET name = source.name, category = source.category
WHEN NOT MATCHED BY TARGET THEN
    INSERT (name, domain, category) VALUES (source.name, source.domain, source.category);
GO

-- -----------------------------------------------------------------------------
-- 3. Промокоды (30 штук)
-- -----------------------------------------------------------------------------
-- Поля:
--   code            — сам промокод (то, что пользователь копирует)
--   discount        — короткое отображение скидки («−500 ₽», «−15%»)
--   description     — описание условий применения
--   expires_at      — дата истечения (NULL = бессрочный)
--   verified_text   — человекочитаемая «свежесть» проверки («2 ч», «5 ч»)
--   status          — active по умолчанию для всех seed-записей
-- -----------------------------------------------------------------------------
MERGE dbo.coupons AS target
USING (
    SELECT m.id AS merchant_id, src.code, src.discount, src.description, src.expires_at, src.verified_text, src.status
    FROM (VALUES
        -- Авиасейлс (1)
        (N'aviasales.ru',     N'AVIA500R',    N'−500 ₽',    N'На первый заказ',                    CONVERT(DATETIME2(0), N'2026-05-31'), N'2 ч',  N'active'),

        -- AliExpress (2 + 1 доп = 3)
        (N'aliexpress.ru',    N'ALI300APP',   N'−300 ₽',    N'На заказ от 2 000 ₽',                CAST(NULL AS DATETIME2(0)),           N'3 ч',  N'active'),
        (N'aliexpress.ru',    N'ALIELEC10',   N'−10%',      N'На электронику',                     CONVERT(DATETIME2(0), N'2026-06-15'), N'5 ч',  N'active'),
        (N'aliexpress.ru',    N'ALINEW20',    N'−20%',      N'Для новых пользователей',            CONVERT(DATETIME2(0), N'2026-07-31'), N'7 ч',  N'active'),

        -- билайн (1)
        (N'beeline.ru',       N'BEE20NEW',    N'−20%',      N'На тариф при смене',                 CAST(NULL AS DATETIME2(0)),           N'8 ч',  N'active'),

        -- Wildberries (4)
        (N'wildberries.ru',   N'WB500RUB',    N'−500 ₽',    N'На заказ от 3 000 ₽',                CONVERT(DATETIME2(0), N'2026-04-20'), N'2 ч',  N'active'),
        (N'wildberries.ru',   N'WB15NEW',     N'−15%',      N'На первый заказ',                    CONVERT(DATETIME2(0), N'2026-06-01'), N'4 ч',  N'active'),
        (N'wildberries.ru',   N'WB300CLO',    N'−300 ₽',    N'На одежду от 2 000 ₽',               CONVERT(DATETIME2(0), N'2026-07-01'), N'1 ч',  N'active'),
        (N'wildberries.ru',   N'WB10SHO',     N'−10%',      N'На обувь',                           CAST(NULL AS DATETIME2(0)),           N'3 ч',  N'active'),

        -- DNS (1 + 1 доп = 2)
        (N'dns-shop.ru',      N'DNS2000N',    N'−2 000 ₽',  N'На ноутбуки от 50 000 ₽',            CONVERT(DATETIME2(0), N'2026-06-10'), N'8 ч',  N'active'),
        (N'dns-shop.ru',      N'DNSTV5',      N'−5%',       N'На телевизоры',                      CONVERT(DATETIME2(0), N'2026-08-01'), N'9 ч',  N'active'),

        -- Delivery Club (1)
        (N'delivery-club.ru', N'DC300FIR',    N'−300 ₽',    N'На первый заказ от 800 ₽',           CONVERT(DATETIME2(0), N'2026-05-30'), N'3 ч',  N'active'),

        -- Золотое Яблоко (2)
        (N'goldapple.ru',     N'GOLD10NW',    N'−10%',      N'На первый заказ',                    CONVERT(DATETIME2(0), N'2026-05-02'), N'3 ч',  N'active'),
        (N'goldapple.ru',     N'GOLDCARE',    N'−15%',      N'На уходовую косметику',              CONVERT(DATETIME2(0), N'2026-06-20'), N'6 ч',  N'active'),

        -- Zara (1 + 1 доп = 2)
        (N'zara.com',         N'ZARA10SS',    N'−10%',      N'На новую коллекцию',                 CONVERT(DATETIME2(0), N'2026-06-01'), N'6 ч',  N'active'),
        (N'zara.com',         N'ZARASALE',    N'−25%',      N'На вещи из распродажи',              CONVERT(DATETIME2(0), N'2026-05-20'), N'10 ч', N'active'),

        -- Ситилинк (2)
        (N'citilink.ru',      N'CITI5PCT',    N'−5%',       N'На весь заказ от 10 000 ₽',          CONVERT(DATETIME2(0), N'2026-05-01'), N'4 ч',  N'active'),
        (N'citilink.ru',      N'CITI10SM',    N'−10%',      N'На смартфоны',                       CONVERT(DATETIME2(0), N'2026-06-30'), N'3 ч',  N'active'),

        -- Самокат (1 + 1 доп = 2)
        (N'samokat.ru',       N'SAM15OFF',    N'−15%',      N'На первые 2 заказа',                 CONVERT(DATETIME2(0), N'2026-06-15'), N'1 ч',  N'active'),
        (N'samokat.ru',       N'SAM200',      N'−200 ₽',    N'На заказ от 1 500 ₽',                CAST(NULL AS DATETIME2(0)),           N'2 ч',  N'active'),

        -- Lamoda (2)
        (N'lamoda.ru',        N'LAMODA15',    N'−15%',      N'На первый заказ',                    CONVERT(DATETIME2(0), N'2026-06-15'), N'5 ч',  N'active'),
        (N'lamoda.ru',        N'LAM500',      N'−500 ₽',    N'От 5 000 ₽',                         CAST(NULL AS DATETIME2(0)),           N'7 ч',  N'active'),

        -- М.Видео (2)
        (N'mvideo.ru',        N'MVIDEO3K',    N'−3 000 ₽',  N'На технику от 30 000 ₽',             CONVERT(DATETIME2(0), N'2026-04-30'), N'1 ч',  N'active'),
        (N'mvideo.ru',        N'MVID500A',    N'−500 ₽',    N'На аксессуары',                      CAST(NULL AS DATETIME2(0)),           N'2 ч',  N'active'),

        -- Ozon (2 + 1 доп = 3)
        (N'ozon.ru',          N'OZON10NEW',   N'−10%',      N'На первый заказ',                    CAST(NULL AS DATETIME2(0)),           N'4 ч',  N'active'),
        (N'ozon.ru',          N'OZON500',     N'−500 ₽',    N'На заказ от 2 500 ₽',                CONVERT(DATETIME2(0), N'2026-05-28'), N'6 ч',  N'active'),
        (N'ozon.ru',          N'OZONBOOKS',  N'−20%',       N'На книги',                           CONVERT(DATETIME2(0), N'2026-07-15'), N'12 ч', N'active'),

        -- Яндекс Еда (1)
        (N'eda.yandex.ru',    N'EDA20NEW',    N'−20%',      N'На первые 3 заказа',                 CAST(NULL AS DATETIME2(0)),           N'14 ч', N'active'),

        -- Яндекс Маркет (1 + 1 доп = 2)
        (N'market.yandex.ru', N'YMKT300',     N'−300 ₽',    N'На первый заказ',                    CONVERT(DATETIME2(0), N'2026-05-31'), N'2 ч',  N'active'),
        (N'market.yandex.ru', N'YMKTPLUS',    N'−10%',      N'Для подписчиков Яндекс Плюс',        CAST(NULL AS DATETIME2(0)),           N'5 ч',  N'active')
    ) AS v (domain, code, discount, description, expires_at, verified_text, status)
    INNER JOIN dbo.merchants m ON m.domain = v.domain
) AS src (merchant_id, code, discount, description, expires_at, verified_text, status)
ON target.merchant_id = src.merchant_id AND target.code = src.code
WHEN MATCHED THEN
    UPDATE SET
        discount       = src.discount,
        description    = src.description,
        expires_at     = src.expires_at,
        verified_text  = src.verified_text,
        status         = src.status
WHEN NOT MATCHED BY TARGET THEN
    INSERT (merchant_id, code, discount, description, expires_at, verified_text, status)
    VALUES (src.merchant_id, src.code, src.discount, src.description, src.expires_at, src.verified_text, src.status);
GO

PRINT N'Seed data loaded: 6 categories, 15 merchants, 30 coupons.';
GO
