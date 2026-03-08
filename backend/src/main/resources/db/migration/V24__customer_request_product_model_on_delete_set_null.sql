-- Allow deleting product models that have customer requests.
-- Customer requests keep their snapshot data; product_model_id becomes NULL.
ALTER TABLE customer_request
    DROP CONSTRAINT IF EXISTS customer_request_product_model_id_fkey;

ALTER TABLE customer_request
    ADD CONSTRAINT customer_request_product_model_id_fkey
    FOREIGN KEY (product_model_id)
    REFERENCES product_model(id)
    ON DELETE SET NULL;
