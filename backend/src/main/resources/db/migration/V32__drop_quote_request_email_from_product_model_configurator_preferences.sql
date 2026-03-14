ALTER TABLE product_model_configurator_preferences
    DROP COLUMN IF EXISTS quote_request_email_template_preset,
    DROP COLUMN IF EXISTS quote_request_email_subject,
    DROP COLUMN IF EXISTS quote_request_email_body;
