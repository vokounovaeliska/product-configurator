-- Configurable default value for INTEGER attributes (must be within min_int..max_int when set)
ALTER TABLE attribute_definition ADD COLUMN default_int INTEGER;

-- Configurable default value for DECIMAL attributes (must be within min_decimal..max_decimal when set)
ALTER TABLE attribute_definition ADD COLUMN default_decimal NUMERIC;
