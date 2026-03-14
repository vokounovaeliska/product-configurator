-- Customizable email template for quote request confirmation.
-- One email to customer with CC to manufacturer. Admin sets subject and body.
ALTER TABLE product_model_configurator_preferences
    ADD COLUMN quote_request_email_subject TEXT,
    ADD COLUMN quote_request_email_body TEXT;
