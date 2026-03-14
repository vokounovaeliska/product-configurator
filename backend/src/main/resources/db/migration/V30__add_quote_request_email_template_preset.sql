-- Preset: 'en' = English default, 'cs' = Czech default, null = custom (use subject/body)
ALTER TABLE product_model_configurator_preferences
    ADD COLUMN quote_request_email_template_preset VARCHAR(8);
