-- Slug for embed URL (e.g. /e/stul-dlask-kulaty), globally unique for public lookup
ALTER TABLE product_model ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE product_model ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT FALSE;

-- Globally unique slug for embed URL lookup (when published)
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_model_slug
    ON product_model(slug) WHERE slug IS NOT NULL AND is_published = TRUE;
