-- Embed URL: /e/{slug} – globally unique slug when published
-- Revert per-user slug index to global unique
DROP INDEX IF EXISTS idx_product_model_user_slug;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_model_slug
    ON product_model(slug) WHERE slug IS NOT NULL AND is_published = TRUE;
