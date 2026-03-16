#!/usr/bin/env bash
# Packages the SketchUp plugin as .rbz for installation
set -e
cd "$(dirname "$0")"
zip -r konfiguruj_export.rbz konfiguruj_export.rb konfiguruj_export/
echo "Created konfiguruj_export.rbz"
