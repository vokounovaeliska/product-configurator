-- Rename base_price_cents column to price and change type from INTEGER to NUMERIC
ALTER TABLE product_model
    RENAME COLUMN base_price_cents TO price;

ALTER TABLE product_model
    ALTER COLUMN price TYPE NUMERIC USING price::NUMERIC;
