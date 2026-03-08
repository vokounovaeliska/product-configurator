-- Background preset for 3D viewer (lightGray, white, gray, dark, warm)
ALTER TABLE product_model_configurator_preferences
    ADD COLUMN background_preset VARCHAR(32) DEFAULT 'lightGray';
