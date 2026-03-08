-- Stores parameter effects from SketchUp plugin (parameters.json).
-- Format: { "WIDTH": [{ "meshNode": "Top", "type": "scale", "axis": "x" }, ...], ... }
ALTER TABLE product_model ADD COLUMN IF NOT EXISTS model_3d_effects JSONB;
