-- =============================================================================
-- GdeKod — тестовые данные (seed) для PostgreSQL
-- Заполняет таблицы categories, merchants, coupons на основе массива PARTNERS
-- из legacy/gdekod-lk.html.
-- =============================================================================
-- Скрипт идемпотентный: можно перезапускать. Использует INSERT ... ON CONFLICT
-- DO UPDATE (PG-аналог T-SQL MERGE), чтобы не задваивать строки и обновлять
-- изменившиеся поля.
--
-- Перед запуском фиксируем TZ сессии в UTC, чтобы голые даты в expires_at
-- интерпретировались как UTC, а не по локальной TZ клиента.
-- =============================================================================

SET TIME ZONE 'UTC';

-- -----------------------------------------------------------------------------
-- 1. Категории (6 штук — как во фронте)
-- -----------------------------------------------------------------------------
INSERT INTO categories ("key", label_ru, sort_order) VALUES
    ('eda',         'Еда и продукты', 10),
    ('odezhda',     'Одежда и обувь', 20),
    ('elektronika', 'Электроника',    30),
    ('travel',      'Путешествия',    40),
    ('krasota',     'Красота',        50),
    ('other',       'Прочее',         60)
ON CONFLICT ("key") DO UPDATE SET
    label_ru   = EXCLUDED.label_ru,
    sort_order = EXCLUDED.sort_order;

-- -----------------------------------------------------------------------------
-- 2. Магазины (15 штук — из массива PARTNERS)
-- -----------------------------------------------------------------------------
INSERT INTO merchants (name, domain, category) VALUES
    ('Авиасейлс',      'aviasales.ru',     'travel'),
    ('AliExpress',     'aliexpress.ru',    'elektronika'),
    ('билайн',         'beeline.ru',       'other'),
    ('Wildberries',    'wildberries.ru',   'odezhda'),
    ('DNS',            'dns-shop.ru',      'elektronika'),
    ('Delivery Club',  'delivery-club.ru', 'eda'),
    ('Золотое Яблоко', 'goldapple.ru',     'krasota'),
    ('Zara',           'zara.com',         'odezhda'),
    ('Ситилинк',       'citilink.ru',      'elektronika'),
    ('Самокат',        'samokat.ru',       'eda'),
    ('Lamoda',         'lamoda.ru',        'odezhda'),
    ('М.Видео',        'mvideo.ru',        'elektronika'),
    ('Ozon',           'ozon.ru',          'other'),
    ('Яндекс Еда',     'eda.yandex.ru',    'eda'),
    ('Яндекс Маркет',  'market.yandex.ru', 'other')
ON CONFLICT (domain) DO UPDATE SET
    name     = EXCLUDED.name,
    category = EXCLUDED.category;

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
--
-- merchant_id резолвится через JOIN по domain — так seed не зависит от
-- порядка SERIAL/IDENTITY-значений.
-- -----------------------------------------------------------------------------
INSERT INTO coupons (merchant_id, code, discount, description, expires_at, verified_text, status)
SELECT m.id, v.code, v.discount, v.description, v.expires_at, v.verified_text, v.status::coupon_status
FROM (VALUES
    -- domain             | code           | discount     | description                            | expires_at                  | verified_text | status
    -- Авиасейлс (1)
    ('aviasales.ru',       'AVIA500R',     '−500 ₽',     'На первый заказ',                       '2026-05-31'::TIMESTAMPTZ,    '2 ч',          'active'),

    -- AliExpress (3)
    ('aliexpress.ru',      'ALI300APP',    '−300 ₽',     'На заказ от 2 000 ₽',                   NULL,                         '3 ч',          'active'),
    ('aliexpress.ru',      'ALIELEC10',    '−10%',       'На электронику',                        '2026-06-15',                 '5 ч',          'active'),
    ('aliexpress.ru',      'ALINEW20',     '−20%',       'Для новых пользователей',               '2026-07-31',                 '7 ч',          'active'),

    -- билайн (1)
    ('beeline.ru',         'BEE20NEW',     '−20%',       'На тариф при смене',                    NULL,                         '8 ч',          'active'),

    -- Wildberries (4)
    ('wildberries.ru',     'WB500RUB',     '−500 ₽',     'На заказ от 3 000 ₽',                   '2026-04-20',                 '2 ч',          'active'),
    ('wildberries.ru',     'WB15NEW',      '−15%',       'На первый заказ',                       '2026-06-01',                 '4 ч',          'active'),
    ('wildberries.ru',     'WB300CLO',     '−300 ₽',     'На одежду от 2 000 ₽',                  '2026-07-01',                 '1 ч',          'active'),
    ('wildberries.ru',     'WB10SHO',      '−10%',       'На обувь',                              NULL,                         '3 ч',          'active'),

    -- DNS (2)
    ('dns-shop.ru',        'DNS2000N',     '−2 000 ₽',   'На ноутбуки от 50 000 ₽',               '2026-06-10',                 '8 ч',          'active'),
    ('dns-shop.ru',        'DNSTV5',       '−5%',        'На телевизоры',                         '2026-08-01',                 '9 ч',          'active'),

    -- Delivery Club (1)
    ('delivery-club.ru',   'DC300FIR',     '−300 ₽',     'На первый заказ от 800 ₽',              '2026-05-30',                 '3 ч',          'active'),

    -- Золотое Яблоко (2)
    ('goldapple.ru',       'GOLD10NW',     '−10%',       'На первый заказ',                       '2026-05-02',                 '3 ч',          'active'),
    ('goldapple.ru',       'GOLDCARE',     '−15%',       'На уходовую косметику',                 '2026-06-20',                 '6 ч',          'active'),

    -- Zara (2)
    ('zara.com',           'ZARA10SS',     '−10%',       'На новую коллекцию',                    '2026-06-01',                 '6 ч',          'active'),
    ('zara.com',           'ZARASALE',     '−25%',       'На вещи из распродажи',                 '2026-05-20',                 '10 ч',         'active'),

    -- Ситилинк (2)
    ('citilink.ru',        'CITI5PCT',     '−5%',        'На весь заказ от 10 000 ₽',             '2026-05-01',                 '4 ч',          'active'),
    ('citilink.ru',        'CITI10SM',     '−10%',       'На смартфоны',                          '2026-06-30',                 '3 ч',          'active'),

    -- Самокат (2)
    ('samokat.ru',         'SAM15OFF',     '−15%',       'На первые 2 заказа',                    '2026-06-15',                 '1 ч',          'active'),
    ('samokat.ru',         'SAM200',       '−200 ₽',     'На заказ от 1 500 ₽',                   NULL,                         '2 ч',          'active'),

    -- Lamoda (2)
    ('lamoda.ru',          'LAMODA15',     '−15%',       'На первый заказ',                       '2026-06-15',                 '5 ч',          'active'),
    ('lamoda.ru',          'LAM500',       '−500 ₽',     'От 5 000 ₽',                            NULL,                         '7 ч',          'active'),

    -- М.Видео (2)
    ('mvideo.ru',          'MVIDEO3K',     '−3 000 ₽',   'На технику от 30 000 ₽',                '2026-04-30',                 '1 ч',          'active'),
    ('mvideo.ru',          'MVID500A',     '−500 ₽',     'На аксессуары',                         NULL,                         '2 ч',          'active'),

    -- Ozon (3)
    ('ozon.ru',            'OZON10NEW',    '−10%',       'На первый заказ',                       NULL,                         '4 ч',          'active'),
    ('ozon.ru',            'OZON500',      '−500 ₽',     'На заказ от 2 500 ₽',                   '2026-05-28',                 '6 ч',          'active'),
    ('ozon.ru',            'OZONBOOKS',    '−20%',       'На книги',                              '2026-07-15',                 '12 ч',         'active'),

    -- Яндекс Еда (1)
    ('eda.yandex.ru',      'EDA20NEW',     '−20%',       'На первые 3 заказа',                    NULL,                         '14 ч',         'active'),

    -- Яндекс Маркет (2)
    ('market.yandex.ru',   'YMKT300',      '−300 ₽',     'На первый заказ',                       '2026-05-31',                 '2 ч',          'active'),
    ('market.yandex.ru',   'YMKTPLUS',     '−10%',       'Для подписчиков Яндекс Плюс',           NULL,                         '5 ч',          'active')
) AS v (domain, code, discount, description, expires_at, verified_text, status)
JOIN merchants m ON m.domain = v.domain
ON CONFLICT (merchant_id, code) DO UPDATE SET
    discount      = EXCLUDED.discount,
    description   = EXCLUDED.description,
    expires_at    = EXCLUDED.expires_at,
    verified_text = EXCLUDED.verified_text,
    status        = EXCLUDED.status;

-- Контрольный вывод (psql покажет результат, в Yandex Console игнорируется).
\echo 'Seed data loaded: 6 categories, 15 merchants, 30 coupons.'
