-- Embed display preferences: what to show in the embedded configurator
ALTER TABLE product_model_configurator_preferences
    ADD COLUMN embed_show_product_name BOOLEAN DEFAULT true,
    ADD COLUMN embed_show_description BOOLEAN DEFAULT true,
    ADD COLUMN embed_show_components BOOLEAN DEFAULT true;
