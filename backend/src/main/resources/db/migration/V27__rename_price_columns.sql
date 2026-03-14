-- attribute_pricing_rule: price_delta_cents -> price (amount in cents)
ALTER TABLE attribute_pricing_rule RENAME COLUMN price_delta_cents TO price;

-- customer_request: total_price_cents -> total_price (amount in cents)
ALTER TABLE customer_request RENAME COLUMN total_price_cents TO total_price;
