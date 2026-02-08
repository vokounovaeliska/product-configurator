-- Support incremental pricing: e.g. +1 CZK per mm of width.
-- When set, modifier = numeric_attribute_value * price_per_unit_cents (in cents).
ALTER TABLE attribute_pricing_rule
    ADD COLUMN price_per_unit_cents INTEGER NULL;

COMMENT ON COLUMN attribute_pricing_rule.price_per_unit_cents IS 'When set, this rule adds (numeric_value * price_per_unit_cents) cents. Used for INTEGER/DECIMAL attributes. Mutually exclusive with fixed price_delta_cents for the same rule.';
