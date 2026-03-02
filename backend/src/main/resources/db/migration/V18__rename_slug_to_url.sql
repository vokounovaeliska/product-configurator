-- Embed URL: /e/{url} – globally unique when published
ALTER TABLE product_model RENAME COLUMN slug TO url;

DROP INDEX IF EXISTS idx_product_model_slug;
DROP INDEX IF EXISTS idx_product_model_user_slug;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_model_url
    ON product_model(url) WHERE url IS NOT NULL AND is_published = TRUE;
