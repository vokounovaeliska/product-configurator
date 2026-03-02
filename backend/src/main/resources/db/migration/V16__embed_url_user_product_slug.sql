-- Embed URL: /e/{userId}/{productSlug} - unique per user so multiple merchants don't collide
-- Drop global unique slug index
DROP INDEX IF EXISTS idx_product_model_slug;

-- Slug unique per user (when published)
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_model_user_slug
    ON product_model(user_id, slug) WHERE slug IS NOT NULL AND is_published = TRUE;
