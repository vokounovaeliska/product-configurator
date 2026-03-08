# frozen_string_literal: true

# Configurator DC Export - SketchUp plugin to export Dynamic Component parameters
# for use with the configurator web app. Outputs parameters.json with effects
# Copyright (c) Vokounova Eliska
# SPDX-License-Identifier: MIT
# supporting one parameter affecting multiple mesh nodes.

Sketchup.require "sketchup"
Sketchup.require "extensions"

unless file_loaded?(__FILE__)
  ext = SketchupExtension.new(
    "Configurator DC Export",
    "configurator_dc_export/dc_parameter_extractor",
  )
  ext.description = "Export Dynamic Component parameters to parameters.json for the configurator (MIT License)"
  ext.version = "1.0.0"
  ext.creator = "Vokounova Eliska"
  Sketchup.register_extension(ext, true)
  file_loaded(__FILE__)
end
