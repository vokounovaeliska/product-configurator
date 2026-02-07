-- Replace any previous image-related columns with numeric image_z_index (frontend stacks by this: lower = back, higher = front)
ALTER TABLE component_definition DROP COLUMN IF EXISTS image_visible;
ALTER TABLE component_definition DROP COLUMN IF EXISTS image_layers_z_index_order;
ALTER TABLE component_definition ADD COLUMN IF NOT EXISTS image_z_index INTEGER NOT NULL DEFAULT 0;
