-- =============================================================================
-- GdeKod — Azure SQL Database schema (T-SQL)
-- Migration: 001_initial
-- Target: Azure SQL Database / SQL Server 2019+
-- =============================================================================
-- This script is idempotent: it can be re-run safely. Each object is created
-- only if it does not already exist.
-- =============================================================================

SET NOCOUNT ON;
GO

-- -----------------------------------------------------------------------------
-- Table: categories
-- Lookup table for merchant categories (food, clothing, electronics, etc.)
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.categories', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.categories (
        id          INT             IDENTITY(1,1) NOT NULL,
        [key]       NVARCHAR(32)    NOT NULL,
        label_ru    NVARCHAR(64)    NOT NULL,
        sort_order  INT             NOT NULL CONSTRAINT DF_categories_sort_order DEFAULT (100),
        CONSTRAINT PK_categories       PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_categories_key   UNIQUE ([key])
    );
END;
GO

-- -----------------------------------------------------------------------------
-- Table: merchants
-- Catalog of partner shops (Wildberries, Ozon, etc.).
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.merchants', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.merchants (
        id          BIGINT          IDENTITY(1,1) NOT NULL,
        name        NVARCHAR(128)   NOT NULL,
        domain      NVARCHAR(255)   NOT NULL,
        category    NVARCHAR(32)    NOT NULL,
        logo_url    NVARCHAR(512)   NULL,
        created_at  DATETIME2(0)    NOT NULL CONSTRAINT DF_merchants_created_at DEFAULT (SYSUTCDATETIME()),
        is_active   BIT             NOT NULL CONSTRAINT DF_merchants_is_active  DEFAULT (1),
        CONSTRAINT PK_merchants            PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_merchants_domain     UNIQUE (domain),
        CONSTRAINT FK_merchants_category   FOREIGN KEY (category) REFERENCES dbo.categories ([key])
    );
END;
GO

-- Index on merchants.domain (lookup by domain when scraping / matching)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_merchants_domain' AND object_id = OBJECT_ID(N'dbo.merchants'))
BEGIN
    CREATE INDEX IX_merchants_domain ON dbo.merchants (domain);
END;
GO

-- -----------------------------------------------------------------------------
-- Table: coupons
-- Promo codes attached to a merchant.
-- status:
--   active                — code is currently usable
--   expired               — past expires_at
--   needs_manual_check    — auto-checker could not verify; human must look
--   removed               — no longer offered (soft-delete)
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.coupons', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.coupons (
        id              BIGINT          IDENTITY(1,1) NOT NULL,
        merchant_id     BIGINT          NOT NULL,
        code            NVARCHAR(64)    NOT NULL,
        discount        NVARCHAR(64)    NOT NULL,
        description     NVARCHAR(512)   NOT NULL,
        expires_at      DATETIME2(0)    NULL,
        last_checked_at DATETIME2(0)    NULL,
        status          NVARCHAR(32)    NOT NULL CONSTRAINT DF_coupons_status DEFAULT (N'active'),
        verified_text   NVARCHAR(64)    NULL,
        created_at      DATETIME2(0)    NOT NULL CONSTRAINT DF_coupons_created_at DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_coupons                  PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_coupons_merchant         FOREIGN KEY (merchant_id) REFERENCES dbo.merchants (id) ON DELETE CASCADE,
        CONSTRAINT UQ_coupons_merchant_code    UNIQUE (merchant_id, code),
        CONSTRAINT CK_coupons_status           CHECK (status IN (N'active', N'expired', N'needs_manual_check', N'removed'))
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_coupons_merchant_id' AND object_id = OBJECT_ID(N'dbo.coupons'))
BEGIN
    CREATE INDEX IX_coupons_merchant_id ON dbo.coupons (merchant_id);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_coupons_status' AND object_id = OBJECT_ID(N'dbo.coupons'))
BEGIN
    CREATE INDEX IX_coupons_status ON dbo.coupons (status);
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_coupons_expires_at' AND object_id = OBJECT_ID(N'dbo.coupons'))
BEGIN
    CREATE INDEX IX_coupons_expires_at ON dbo.coupons (expires_at);
END;
GO

-- -----------------------------------------------------------------------------
-- Table: coupon_checks
-- Append-only history of automated coupon verifications.
-- result mirrors the coupon.status values that the checker can produce.
-- -----------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.coupon_checks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.coupon_checks (
        id                  BIGINT          IDENTITY(1,1) NOT NULL,
        coupon_id           BIGINT          NOT NULL,
        checked_at          DATETIME2(0)    NOT NULL CONSTRAINT DF_coupon_checks_checked_at DEFAULT (SYSUTCDATETIME()),
        result              NVARCHAR(32)    NOT NULL,
        raw_response_text   NVARCHAR(MAX)   NULL,
        CONSTRAINT PK_coupon_checks         PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_coupon_checks_coupon  FOREIGN KEY (coupon_id) REFERENCES dbo.coupons (id) ON DELETE CASCADE,
        CONSTRAINT CK_coupon_checks_result  CHECK (result IN (N'active', N'expired', N'needs_manual_check', N'removed'))
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_coupon_checks_coupon_id' AND object_id = OBJECT_ID(N'dbo.coupon_checks'))
BEGIN
    CREATE INDEX IX_coupon_checks_coupon_id ON dbo.coupon_checks (coupon_id, checked_at DESC);
END;
GO

PRINT N'GdeKod schema migration applied successfully.';
GO
