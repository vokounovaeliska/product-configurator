-- Configurator preferences per product model (zoom level etc.)
CREATE TABLE product_model_configurator_preferences (
    product_model_id        UUID PRIMARY KEY NOT NULL REFERENCES product_model(id) ON DELETE CASCADE,
    zoom_distance_default   DECIMAL(5, 2),
    zoom_distance_embed     DECIMAL(5, 2),
    created_at              TIMESTAMPTZ NOT NULL,
    modified_at             TIMESTAMPTZ NOT NULL
);
