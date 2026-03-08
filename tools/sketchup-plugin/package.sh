#!/usr/bin/env bash
# Packages the SketchUp plugin as .rbz for installation
set -e
cd "$(dirname "$0")"
zip -r configurator_dc_export.rbz configurator_dc_export.rb configurator_dc_export/
echo "Created configurator_dc_export.rbz"
