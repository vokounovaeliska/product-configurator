-- Remove price-per-unit feature: fixed price only per rule.
ALTER TABLE attribute_pricing_rule
    DROP COLUMN IF EXISTS price_per_unit_cents;
