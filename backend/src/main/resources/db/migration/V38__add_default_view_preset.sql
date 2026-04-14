-- Saved default camera angles (horizontal = around Y, vertical = from +Y; Three.js θ / φ). NULL = automatic.
ALTER TABLE product_model_configurator_preferences
    ADD COLUMN camera_horizontal_angle_rad DOUBLE PRECISION,
    ADD COLUMN camera_vertical_angle_rad DOUBLE PRECISION;

COMMENT ON COLUMN product_model_configurator_preferences.camera_horizontal_angle_rad IS
    'Horizontal camera angle around Y through target (rad), spherical.theta. NULL = automatic.';
COMMENT ON COLUMN product_model_configurator_preferences.camera_vertical_angle_rad IS
    'Vertical camera angle from +Y toward horizontal (rad), spherical.phi. NULL = automatic.';
