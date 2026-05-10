-- =============================================================================
-- GdeKod — PostgreSQL schema
-- Migration: 001_initial
-- Target: Yandex Managed PostgreSQL 15+
-- =============================================================================
-- This script is idempotent: it can be re-run safely. Each object is created
-- only if it does not already exist.
--
-- Differences from the T-SQL version (../schema.sql):
--   * GENERATED ALWAYS AS IDENTITY      instead of IDENTITY(1,1)
--   * VARCHAR / TEXT                    instead of NVARCHAR (PG strings are
--                                       Unicode by default)
--   * BOOLEAN                           instead of BIT
--   * TIMESTAMP WITH TIME ZONE          instead of DATETIME2
--   * NOW()                             instead of SYSUTCDATETIME()
--                                       (TIMESTAMPTZ stores UTC internally;
--                                       NOW() is the idiomatic default)
--   * native ENUM `coupon_status`       instead of CHECK CONSTRAINT
--   * CREATE TABLE IF NOT EXISTS        instead of IF OBJECT_ID(...) IS NULL
--   * default `public` schema           instead of `dbo`
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ENUM type: coupon_status
-- Used by both coupons.status and coupon_checks.result.
--   active             — code is currently usable
--   expired            — past expires_at
--   needs_manual_check — auto-checker could not verify; human must look
--   removed            — no longer offered (soft-delete)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coupon_status') THEN
        CREATE TYPE coupon_status AS ENUM (
            'active',
            'expired',
            'needs_manual_check',
            'removed'
        );
    END IF;
END$$;

-- -----------------------------------------------------------------------------
-- Table: categories
-- Lookup table for merchant categories (food, clothing, electronics, etc.)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id          INTEGER         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "key"       VARCHAR(32)     NOT NULL UNIQUE,
    label_ru    VARCHAR(64)     NOT NULL,
    sort_order  INTEGER         NOT NULL DEFAULT 100
);

-- -----------------------------------------------------------------------------
-- Table: merchants
-- Catalog of partner shops (Wildberries, Ozon, etc.).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchants (
    id          BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(128)    NOT NULL,
    domain      VARCHAR(255)    NOT NULL UNIQUE,
    category    VARCHAR(32)     NOT NULL REFERENCES categories ("key"),
    logo_url    VARCHAR(512),
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE
);

-- Note: lookup by merchants.domain is already covered by the implicit unique
-- index that PostgreSQL creates for the UNIQUE constraint above; no separate
-- index is needed (unlike the T-SQL version, which declares IX_merchants_domain
-- explicitly).

-- -----------------------------------------------------------------------------
-- Table: coupons
-- Promo codes attached to a merchant.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupons (
    id              BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    merchant_id     BIGINT          NOT NULL REFERENCES merchants (id) ON DELETE CASCADE,
    code            VARCHAR(64)     NOT NULL,
    discount        VARCHAR(64)     NOT NULL,
    description     VARCHAR(512)    NOT NULL,
    expires_at      TIMESTAMP WITH TIME ZONE,
    last_checked_at TIMESTAMP WITH TIME ZONE,
    status          coupon_status   NOT NULL DEFAULT 'active',
    verified_text   VARCHAR(64),
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_coupons_merchant_code UNIQUE (merchant_id, code)
);

CREATE INDEX IF NOT EXISTS ix_coupons_merchant_id ON coupons (merchant_id);
CREATE INDEX IF NOT EXISTS ix_coupons_status      ON coupons (status);
CREATE INDEX IF NOT EXISTS ix_coupons_expires_at  ON coupons (expires_at);

-- -----------------------------------------------------------------------------
-- Table: coupon_checks
-- Append-only history of automated coupon verifications.
-- result reuses the coupon_status ENUM, so the four allowed values stay in
-- one place.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coupon_checks (
    id                BIGINT          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    coupon_id         BIGINT          NOT NULL REFERENCES coupons (id) ON DELETE CASCADE,
    checked_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    result            coupon_status   NOT NULL,
    raw_response_text TEXT
);

CREATE INDEX IF NOT EXISTS ix_coupon_checks_coupon_id ON coupon_checks (coupon_id, checked_at DESC);
