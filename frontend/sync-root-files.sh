#!/bin/bash
# Script to sync root monorepo files to frontend/ for Railway builds
# Run this before committing if you've updated root package.json, turbo.json, or pnpm-lock.yaml

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Syncing root files to frontend/ for Railway builds..."
cp "$ROOT_DIR/package.json" "$SCRIPT_DIR/package.json"
cp "$ROOT_DIR/turbo.json" "$SCRIPT_DIR/turbo.json"
cp "$ROOT_DIR/pnpm-lock.yaml" "$SCRIPT_DIR/pnpm-lock.yaml"
echo "✓ Files synced successfully"

