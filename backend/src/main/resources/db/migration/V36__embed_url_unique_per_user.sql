-- Embed path segment is unique per vendor (user), not globally: /e/{user_id}/{url}
DROP INDEX IF EXISTS idx_product_model_url;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_model_user_url
    ON product_model (user_id, url)
    WHERE url IS NOT NULL AND is_published = TRUE;
