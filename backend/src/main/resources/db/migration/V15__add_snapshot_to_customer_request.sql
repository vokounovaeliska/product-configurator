-- 3D model snapshot as base64 data URL for email and request detail
ALTER TABLE customer_request ADD COLUMN IF NOT EXISTS snapshot_image_base64 TEXT;
