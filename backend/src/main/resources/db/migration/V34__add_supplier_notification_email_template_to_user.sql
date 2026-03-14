ALTER TABLE "user"
    ADD COLUMN supplier_notification_email_template_preset TEXT,
    ADD COLUMN supplier_notification_email_subject TEXT,
    ADD COLUMN supplier_notification_email_body TEXT,
    ADD COLUMN supplier_notification_email_body_is_html BOOLEAN DEFAULT FALSE;
