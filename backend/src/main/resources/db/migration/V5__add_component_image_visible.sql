-- Add image visibility flag to component_definition (controls whether component image is shown in configurator)
ALTER TABLE component_definition ADD COLUMN image_visible BOOLEAN NOT NULL DEFAULT true;
