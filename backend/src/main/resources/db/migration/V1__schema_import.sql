-- UUID extension (Supabase usually has this, but added for safety)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================
-- ENUM TYPES
-- =========================================

CREATE TYPE attribute_type AS ENUM ('ENUM', 'INTEGER', 'DECIMAL', 'BOOLEAN');
CREATE TYPE condition_operator AS ENUM ('EQ', 'BETWEEN');
CREATE TYPE request_status AS ENUM ('NEW', 'IN_PROGRESS', 'OFFER_SENT', 'CLOSED');

-- =========================================
-- ADMIN USERS (only admins stored, customers are anonymous)
-- =========================================

CREATE TABLE "user" (
                        id             UUID PRIMARY KEY NOT NULL,
                        email          TEXT NOT NULL UNIQUE,
                        created_at     TIMESTAMPTZ NOT NULL,
                        modified_at    TIMESTAMPTZ NOT NULL,
                        first_name     TEXT NOT NULL,
                        surname        TEXT NOT NULL,
                        password       TEXT NOT NULL,
                        check_sum      TEXT NOT NULL
);

CREATE TABLE user_refresh_token (
                                    jwt_id     UUID PRIMARY KEY NOT NULL,
                                    user_id    UUID NOT NULL,
                                    created_at timestamptz NOT NULL,
                                    expires_at timestamptz NOT NULL
);

CREATE INDEX user_refresh_token_user_id_idx ON user_refresh_token (user_id);

-- =========================================
-- PRODUCT MODELING
-- =========================================

-- Product model, e.g. "Table Icatu", "Wardrobe Oslo"
CREATE TABLE product_model (
                               id                 UUID PRIMARY KEY NOT NULL,
                               user_id            UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
                               name               TEXT NOT NULL,
                               description        TEXT,
                               base_price_cents   INTEGER NOT NULL DEFAULT 0,
                               currency           TEXT NOT NULL DEFAULT 'CZK',
                               is_active          BOOLEAN NOT NULL DEFAULT TRUE,
                               created_at         TIMESTAMPTZ NOT NULL,
                               modified_at        TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_product_model_user_id
    ON product_model(user_id);

-- Component definitions, e.g. "TOP", "LEGS", "DOOR"
CREATE TABLE component_definition (
                                      id                 UUID PRIMARY KEY NOT NULL,
                                      product_model_id   UUID NOT NULL REFERENCES product_model(id) ON DELETE CASCADE,
                                      code               TEXT NOT NULL,
                                      label              TEXT NOT NULL,
                                      description        TEXT,
                                      sort_order         INTEGER NOT NULL DEFAULT 0,
                                      preview_image_url  TEXT,
                                      created_at         TIMESTAMPTZ NOT NULL,
                                      modified_at        TIMESTAMPTZ NOT NULL,
                                      UNIQUE (product_model_id, code)
);

CREATE INDEX idx_component_definition_model_id
    ON component_definition(product_model_id);

-- Attribute definitions per component, e.g. WIDTH, HEIGHT, COLOR
CREATE TABLE attribute_definition (
                                      id                   UUID PRIMARY KEY NOT NULL,
                                      component_id         UUID NOT NULL REFERENCES component_definition(id) ON DELETE CASCADE,
                                      code                 TEXT NOT NULL,
                                      label                TEXT NOT NULL,
                                      type                 attribute_type NOT NULL,
                                      is_required          BOOLEAN NOT NULL DEFAULT TRUE,

    -- INTEGER range
                                      min_int              INTEGER,
                                      max_int              INTEGER,

    -- DECIMAL range
                                      min_decimal          NUMERIC,
                                      max_decimal          NUMERIC,

                                      sort_order           INTEGER NOT NULL DEFAULT 0,
                                      created_at           TIMESTAMPTZ NOT NULL,
                                      modified_at          TIMESTAMPTZ NOT NULL,
                                      UNIQUE (component_id, code)
);

CREATE INDEX idx_attribute_definition_component_id
    ON attribute_definition(component_id);

-- Attribute options for ENUM attributes (COLOR = WHITE, OAK_01, etc.)
CREATE TABLE attribute_option (
                                  id                   UUID PRIMARY KEY NOT NULL,
                                  attribute_id         UUID NOT NULL REFERENCES attribute_definition(id) ON DELETE CASCADE,
                                  value                TEXT NOT NULL,
                                  label                TEXT NOT NULL,
                                  image_url            TEXT,
                                  sort_order           INTEGER NOT NULL DEFAULT 0,
                                  created_at           TIMESTAMPTZ NOT NULL,
                                  modified_at          TIMESTAMPTZ NOT NULL,
                                  UNIQUE (attribute_id, value)
);

CREATE INDEX idx_attribute_option_attribute_id
    ON attribute_option(attribute_id);

-- =========================================
-- DEPENDENT ATTRIBUTE RULES (NEW TABLE)
-- Allows defining allowed combinations, e.g.
-- When LEG_TYPE = OAK -> LEG_COLOR can be {OAK_NATURAL, OAK_DARK}
-- =========================================

CREATE TABLE attribute_option_constraint (
                                             id                   UUID PRIMARY KEY NOT NULL,

                                             component_id         UUID NOT NULL REFERENCES component_definition(id) ON DELETE CASCADE,

    -- "When" attribute and selected option (e.g. LEG_TYPE = OAK)
                                             when_attribute_id    UUID NOT NULL REFERENCES attribute_definition(id) ON DELETE CASCADE,
                                             when_option_id       UUID NOT NULL REFERENCES attribute_option(id) ON DELETE CASCADE,

    -- "Allowed" target attribute and option (e.g. LEG_COLOR = OAK_DARK)
                                             target_attribute_id  UUID NOT NULL REFERENCES attribute_definition(id) ON DELETE CASCADE,
                                             allowed_option_id    UUID NOT NULL REFERENCES attribute_option(id) ON DELETE CASCADE,

                                             created_at           TIMESTAMPTZ NOT NULL,
                                             modified_at          TIMESTAMPTZ NOT NULL,

                                             UNIQUE (component_id, when_option_id, allowed_option_id)
);

CREATE INDEX idx_attr_option_constraint_component
    ON attribute_option_constraint(component_id);

-- =========================================
-- IMAGE LAYERS (2D representation)
-- =========================================

CREATE TABLE image_layer_definition (
                                        id               UUID PRIMARY KEY NOT NULL,
                                        component_id     UUID NOT NULL REFERENCES component_definition(id) ON DELETE CASCADE,
                                        image_url        TEXT NOT NULL,
                                        z_index          INTEGER NOT NULL DEFAULT 0,

    -- JSON conditions based on attribute values
                                        conditions       JSONB NOT NULL DEFAULT '[]'::jsonb,

                                        created_at       TIMESTAMPTZ NOT NULL,
                                        modified_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_image_layer_component_id
    ON image_layer_definition(component_id);

-- =========================================
-- PRICING RULES
-- =========================================

CREATE TABLE attribute_pricing_rule (
                                        id                UUID PRIMARY KEY NOT NULL,
                                        product_model_id  UUID NOT NULL REFERENCES product_model(id) ON DELETE CASCADE,
                                        component_id      UUID REFERENCES component_definition(id) ON DELETE CASCADE,
                                        attribute_code    TEXT NOT NULL,
                                        operator          condition_operator NOT NULL DEFAULT 'EQ',
                                        value             TEXT NOT NULL,
                                        to_value          TEXT,
                                        price_delta_cents INTEGER NOT NULL,
                                        created_at        TIMESTAMPTZ NOT NULL,
                                        modified_at       TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_attribute_pricing_rule_model
    ON attribute_pricing_rule(product_model_id);

-- =========================================
-- CUSTOMER REQUESTS (full snapshot)
-- =========================================

CREATE TABLE customer_request (
                                  id                       UUID PRIMARY KEY NOT NULL,

                                  status                   request_status NOT NULL DEFAULT 'NEW',

    -- Customer contact info
                                  customer_name            TEXT,
                                  customer_email           TEXT NOT NULL,
                                  customer_phone           TEXT,
                                  customer_note            TEXT,

    -- Reference to product model
                                  product_model_id         UUID REFERENCES product_model(id),

    -- Snapshot data
                                  product_model_name       TEXT NOT NULL,
                                  product_model_description TEXT,
                                  currency                 TEXT NOT NULL,

                                  total_price_cents        INTEGER NOT NULL,
                                  configuration_json       JSONB NOT NULL,
                                  pricing_breakdown_json   JSONB,

                                  created_at               TIMESTAMPTZ NOT NULL,
                                  modified_at              TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_customer_request_status_created
    ON customer_request(status, created_at DESC);

CREATE INDEX idx_customer_request_email
    ON customer_request(customer_email);

-- Component snapshot inside request (optional but useful)
CREATE TABLE customer_request_component (
                                            id                    UUID PRIMARY KEY NOT NULL,
                                            request_id            UUID NOT NULL REFERENCES customer_request(id) ON DELETE CASCADE,
                                            component_code        TEXT NOT NULL,
                                            component_label       TEXT NOT NULL,
                                            quantity              INTEGER NOT NULL DEFAULT 1,
                                            sort_order            INTEGER NOT NULL DEFAULT 0,
                                            attributes_json       JSONB NOT NULL,
                                            created_at            TIMESTAMPTZ NOT NULL,
                                            modified_at           TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_customer_request_component_request_id
    ON customer_request_component(request_id);