-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Setup for IMMUTABLE UNACCENT (required for using the unaccent function in generated fields)
-- By default, unaccent is not immutable, and cannot be used in fields marked as 'GENERATED ALWAYS AS () STORED'
-- (throws ERROR: generation expression is not immutable)
--
-- https://stackoverflow.com/a/11007216
CREATE OR REPLACE FUNCTION public.f_unaccent(text)
    RETURNS text
    LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
    $func$
    SELECT public.unaccent('public.unaccent', $1)  -- schema-qualify function and dictionary
    $func$;

-- Precalculated field for searching
ALTER TABLE "public"."user" ADD COLUMN search_vector text GENERATED ALWAYS AS (
    f_unaccent(lower( first_name || ' ' || surname || ' ' || email))
) STORED;

-- GIN index using trigram ops for efficient ILIKE and partial text search on search_vector
CREATE INDEX "ix_user_search_vector" ON public."user"
    USING gin (search_vector gin_trgm_ops);
