CREATE TABLE configurator_analytics_event (
    id                  UUID PRIMARY KEY        DEFAULT gen_random_uuid(),
    occurred_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    event_type          VARCHAR(64)    NOT NULL,
    session_id          VARCHAR(128)   NOT NULL,
    product_model_id    UUID           NOT NULL REFERENCES product_model (id) ON DELETE CASCADE,
    embed_owner_user_id UUID                    REFERENCES "user" (id) ON DELETE SET NULL,
    embed_product_url   VARCHAR(512),
    surface             VARCHAR(32)    NOT NULL,
    customer_request_id UUID                    REFERENCES customer_request (id) ON DELETE SET NULL,
    CONSTRAINT configurator_analytics_event_type_chk CHECK (
        event_type IN (
            'CONFIGURATOR_OPEN',
            'CONFIGURATION_CHANGE',
            'REQUEST_FORM_OPEN',
            'REQUEST_SUBMITTED'
            )
        ),
    CONSTRAINT configurator_analytics_event_surface_chk CHECK (
        surface IN ('EMBED_IFRAME', 'PUBLIC_CONFIGURATOR_PAGE')
        )
);

CREATE INDEX idx_analytics_event_product_occurred
    ON configurator_analytics_event (product_model_id, occurred_at DESC);

CREATE INDEX idx_analytics_event_owner_url_occurred
    ON configurator_analytics_event (embed_owner_user_id, embed_product_url, occurred_at DESC);

CREATE INDEX idx_analytics_event_session
    ON configurator_analytics_event (session_id, occurred_at DESC);

CREATE INDEX idx_analytics_event_customer_request
    ON configurator_analytics_event (customer_request_id);
