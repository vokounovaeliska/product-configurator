-- Rozšíření pro UUID (v Supabase bývá dostupné, ale pro jistotu):
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================
-- ENUM TYPES
-- =========================================

CREATE TYPE attribute_type AS ENUM ('ENUM', 'INTEGER', 'DECIMAL', 'BOOLEAN');
CREATE TYPE condition_operator AS ENUM ('EQ', 'BETWEEN');
CREATE TYPE request_status AS ENUM ('NEW', 'IN_PROGRESS', 'OFFER_SENT', 'CLOSED');

-- =========================================
-- ADMIN USERS (jen admini, zákazníci jsou anonymní)
-- =========================================

CREATE TABLE "user" (
                            id             UUID PRIMARY KEY NOT NULL,
                            email          TEXT NOT NULL UNIQUE,
                            created_at     TIMESTAMPTZ NOT NULL,
                            modified_at     TIMESTAMPTZ NOT NULL,
                            first_name text NOT NULL,
                            surname text NOT NULL,
                            password text NOT NULL,
                            check_sum text NOT NULL
);

CREATE TABLE user_refresh_token (
                                    jwt_id UUID PRIMARY KEY NOT NULL,
                                    user_id UUID NOT NULL,
                                    created_at timestamptz NOT NULL,
                                    expires_at timestamptz NOT NULL
);

CREATE INDEX user_refresh_token_user_id_idx ON user_refresh_token (user_id);

-- =========================================
-- PRODUCT MODELING (modely, komponenty, atributy)
-- =========================================

-- Produktový model: např. "Stůl Icatu", "Skříň Oslo"
CREATE TABLE product_model (
                               id                 UUID PRIMARY KEY NOT NULL,
                               name               TEXT NOT NULL,
                               description        TEXT,
                               base_price_cents   INTEGER NOT NULL DEFAULT 0,
                               currency           TEXT NOT NULL DEFAULT 'CZK',
                               is_active          BOOLEAN NOT NULL DEFAULT TRUE,
                               created_at         TIMESTAMPTZ NOT NULL,
                               modified_at         TIMESTAMPTZ NOT NULL
);

-- Komponenty modelu: "TOP", "LEGS", "LEFT_MODULE", "DOOR"...
CREATE TABLE component_definition (
                                      id               UUID PRIMARY KEY NOT NULL,
                                      product_model_id UUID NOT NULL REFERENCES product_model(id) ON DELETE CASCADE,
                                      code             TEXT NOT NULL,      -- např. 'TOP'
                                      label            TEXT NOT NULL,      -- "Deska stolu"
                                      description      TEXT,
                                      sort_order       INTEGER NOT NULL DEFAULT 0,
                                      preview_image_url TEXT,              -- ilustrační obrázek komponenty (ne vizualizační vrstva)
                                      created_at       TIMESTAMPTZ NOT NULL,
                                      modified_at       TIMESTAMPTZ NOT NULL,
                                      UNIQUE (product_model_id, code)
);

CREATE INDEX idx_component_definition_model_id
    ON component_definition(product_model_id);

-- Definice atributů pro komponentu: WIDTH, HEIGHT, COLOR, MATERIAL...
CREATE TABLE attribute_definition (
                                      id                   UUID PRIMARY KEY NOT NULL,
                                      component_id         UUID NOT NULL REFERENCES component_definition(id) ON DELETE CASCADE,
                                      code                 TEXT NOT NULL,   -- např. 'WIDTH', 'COLOR'
                                      label                TEXT NOT NULL,
                                      type                 attribute_type NOT NULL,
                                      is_required          BOOLEAN NOT NULL DEFAULT TRUE,

    -- pro INTEGER
                                      min_int              INTEGER,
                                      max_int              INTEGER,

    -- pro DECIMAL
                                      min_decimal          NUMERIC,
                                      max_decimal          NUMERIC,

                                      sort_order           INTEGER NOT NULL DEFAULT 0,
                                      created_at           TIMESTAMPTZ NOT NULL,
                                      modified_at           TIMESTAMPTZ NOT NULL,
                                      UNIQUE (component_id, code)
);

CREATE INDEX idx_attribute_definition_component_id
    ON attribute_definition(component_id);

-- Konkrétní ENUM hodnoty atributu (např. COLOR = OAK_01, WHITE_01) + obrázek swatche
CREATE TABLE attribute_option (
                                  id                   UUID PRIMARY KEY NOT NULL,
                                  attribute_id         UUID NOT NULL REFERENCES attribute_definition(id) ON DELETE CASCADE,
                                  value                TEXT NOT NULL,   -- interní hodnota, např. 'OAK_01'
                                  label                TEXT NOT NULL,   -- "Dub přírodní"
                                  image_url            TEXT,            -- malý náhled / swatch
                                  sort_order           INTEGER NOT NULL DEFAULT 0,
                                  created_at           TIMESTAMPTZ NOT NULL,
                                  modified_at           TIMESTAMPTZ NOT NULL,
                                  UNIQUE (attribute_id, value)
);

CREATE INDEX idx_attribute_option_attribute_id
    ON attribute_option(attribute_id);

-- =========================================
-- VIZUALIZAČNÍ VRSTVY (kombinace atributů → konkrétní obrázek)
-- =========================================

CREATE TABLE image_layer_definition (
                                        id               UUID PRIMARY KEY NOT NULL,
                                        component_id     UUID NOT NULL REFERENCES component_definition(id) ON DELETE CASCADE,
                                        image_url        TEXT NOT NULL,             -- URL v externím storage (R2, atd.)
                                        z_index          INTEGER NOT NULL DEFAULT 0,

    -- Seznam podmínek ve formátu JSON:
    -- [
    --   { "attributeCode": "COLOR", "operator": "EQ", "value": "OAK_01" },
    --   { "attributeCode": "WIDTH", "operator": "BETWEEN", "value": "1400", "toValue": "1600" }
    -- ]
                                        conditions       JSONB NOT NULL DEFAULT '[]'::jsonb,

                                        created_at       TIMESTAMPTZ NOT NULL,
                                        modified_at       TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_image_layer_component_id
    ON image_layer_definition(component_id);

-- =========================================
-- PRICING RULES (jak atributy ovlivňují cenu)
-- =========================================

CREATE TABLE attribute_pricing_rule (
                                        id                UUID PRIMARY KEY NOT NULL,
                                        product_model_id  UUID NOT NULL REFERENCES product_model(id) ON DELETE CASCADE,
                                        component_id      UUID REFERENCES component_definition(id) ON DELETE CASCADE,
                                        attribute_code    TEXT NOT NULL,                 -- např. 'COLOR' nebo 'WIDTH'
                                        operator          condition_operator NOT NULL DEFAULT 'EQ',
                                        value             TEXT NOT NULL,                 -- např. 'OAK_01' nebo '1400'
                                        to_value          TEXT,                          -- pro BETWEEN
                                        price_delta_cents INTEGER NOT NULL,              -- změna ceny v centech
                                        created_at        TIMESTAMPTZ NOT NULL,
                                        modified_at        TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_attribute_pricing_rule_model
    ON attribute_pricing_rule(product_model_id);

-- =========================================
-- CUSTOMER REQUESTS (draft objednávky se SNAPSHOTEM)
-- =========================================

CREATE TABLE customer_request (
                                  id                     UUID PRIMARY KEY NOT NULL,

                                  status                 request_status NOT NULL DEFAULT 'NEW',

    -- kontaktní údaje zákazníka (bez účtu)
                                  customer_name          TEXT,
                                  customer_email         TEXT NOT NULL,
                                  customer_phone         TEXT,
                                  customer_note          TEXT,

    -- reference na model (pro interní vazbu, ne pro interpretaci snapshotu)
                                  product_model_id       UUID REFERENCES product_model(id),

    -- SNAPSHOT: meta informace modelu v době odeslání
                                  product_model_name         TEXT NOT NULL,
                                  product_model_description  TEXT,
                                  currency                   TEXT NOT NULL,

    -- SNAPSHOT: finální cena v centech
                                  total_price_cents      INTEGER NOT NULL,

    -- SNAPSHOT: plná konfigurace v JSON:
    -- {
    --   "components": [
    --     {
    --       "componentCode": "TOP",
    --       "label": "Deska stolu",
    --       "quantity": 1,
    --       "attributes": {
    --         "WIDTH": { "type": "INTEGER", "value": 1600 },
    --         "COLOR": { "type": "ENUM", "value": "OAK_01", "label": "Dub přírodní" }
    --       }
    --     },
    --     ...
    --   ]
    -- }
                                  configuration_json     JSONB NOT NULL,

    -- SNAPSHOT: rozpad ceny, pokud chceš:
    -- { "basePrice": 200000, "attributeModifiers": [ ... ], "finalPrice": 230000 }
                                  pricing_breakdown_json JSONB,

                                  created_at             TIMESTAMPTZ NOT NULL,
                                  modified_at             TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_customer_request_status_created
    ON customer_request(status, created_at DESC);

CREATE INDEX idx_customer_request_email
    ON customer_request(customer_email);

-- Strukturovanější pohled na komponenty v requestu (pohodlnější na dotazy)
CREATE TABLE customer_request_component (
                                            id                   UUID PRIMARY KEY NOT NULL,
                                            request_id           UUID NOT NULL REFERENCES customer_request(id) ON DELETE CASCADE,

    -- SNAPSHOT: komponenta v době requestu
                                            component_code       TEXT NOT NULL,
                                            component_label      TEXT NOT NULL,
                                            quantity             INTEGER NOT NULL DEFAULT 1,
                                            sort_order           INTEGER NOT NULL DEFAULT 0,

    -- SNAPSHOT: atributy pro tuto komponentu:
    -- {
    --   "WIDTH": { "type": "INTEGER", "value": 1600 },
    --   "COLOR": { "type": "ENUM", "value": "OAK_01", "label": "Dub přírodní" }
    -- }
                                            attributes_json      JSONB NOT NULL,

                                            created_at           TIMESTAMPTZ NOT NULL,
                                            modified_at           TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_customer_request_component_request_id
    ON customer_request_component(request_id);