-- Default 3D viewer background: white (was lightGray)
ALTER TABLE product_model_configurator_preferences
    ALTER COLUMN background_preset SET DEFAULT 'white';
