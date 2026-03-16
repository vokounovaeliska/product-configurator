# frozen_string_literal: true

# Konfiguruj Export - SketchUp plugin to export Dynamic Component parameters
# for use with the configurator web app. Outputs parameters.json with effects
# Copyright (c) Vokounova Eliska
# SPDX-License-Identifier: MIT
# supporting one parameter affecting multiple mesh nodes.

Sketchup.require "sketchup"
Sketchup.require "extensions"

unless file_loaded?(__FILE__)
  ext = SketchupExtension.new(
    "Konfiguruj Export",
    "konfiguruj_export/dc_parameter_extractor",
  )
  ext.description = "Export Dynamic Components to GLB + parameters.json for the Konfiguruj web configurator."
  ext.version = "1.0.0"
  ext.creator = "Eliška Vokounová"
  Sketchup.register_extension(ext, true)
  file_loaded(__FILE__)
end
