-- At most one client-originated row per session, event type, product model, and calendar day (UTC).
-- REQUEST_SUBMITTED: one row per customer_request_id.

ALTER TABLE configurator_analytics_event
    ADD COLUMN IF NOT EXISTS occurred_on_utc date GENERATED ALWAYS AS ((timezone('UTC', occurred_at))::date) STORED;

-- Existing data may already violate uniqueness; keep earliest row per key.
DELETE FROM configurator_analytics_event AS del
    USING (SELECT id,
                  row_number() OVER (
                      PARTITION BY session_id, event_type, product_model_id, occurred_on_utc
                      ORDER BY occurred_at ASC, id ASC
                      ) AS rn
           FROM configurator_analytics_event
           WHERE customer_request_id IS NULL) AS ranked
WHERE del.id = ranked.id
  AND ranked.rn > 1;

DELETE FROM configurator_analytics_event AS del
    USING (SELECT id,
                  row_number() OVER (
                      PARTITION BY customer_request_id
                      ORDER BY occurred_at ASC, id ASC
                      ) AS rn
           FROM configurator_analytics_event
           WHERE event_type = 'REQUEST_SUBMITTED'
             AND customer_request_id IS NOT NULL) AS ranked
WHERE del.id = ranked.id
  AND ranked.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_event_dedupe_client_session
    ON configurator_analytics_event (session_id, event_type, product_model_id, occurred_on_utc)
    WHERE customer_request_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_analytics_event_request_submitted
    ON configurator_analytics_event (customer_request_id)
    WHERE event_type = 'REQUEST_SUBMITTED'
      AND customer_request_id IS NOT NULL;
