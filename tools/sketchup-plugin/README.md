# Configurator DC Export – SketchUp Plugin

Exports Dynamic Component parameters from SketchUp to `parameters.json` for use with the configurator web app. Supports **one parameter affecting multiple mesh nodes** (e.g. `width` → Top scale, Bottom scale, Legs2 position).

**Note:** After adding this feature, run `pnpm backend:migrate` (with DB running) to apply the `model_3d_effects` column and regenerate jOOQ.

## Debugging

If the plugin doesn't export anything:

1. **Open the Ruby Console** – **Window → Ruby Console** (or **Extensions → Developer → Ruby Console**)
2. Run **Plugins → Configurator → Debug: Show what plugin finds**
3. Check the Ruby Console output – it shows what entities, definitions, and dynamic attributes the plugin sees
4. Ensure your root group/component with parameters is **selected** before running Export or Debug

## Installation

1. Package the plugin as `.rbz` (from project root):
   ```bash
   cd tools/sketchup-plugin
   zip -r configurator_dc_export.rbz configurator_dc_export.rb configurator_dc_export/
   ```
   Or run: `./package.sh` if available.

2. In SketchUp: **Window → Extension Manager → Install Extension**
3. Select `configurator_dc_export.rbz`

## Usage

1. Open a SketchUp model with Dynamic Components
2. **Plugins → Configurator → Export for Configurator (zip + GLB)**
3. Choose save location (default: `modelname_configurator.zip`)
4. The plugin creates:
   - **`modelname_configurator.zip`** – contains `parameters.json` + `materials/` (PNG textures)
   - **`modelname_configurator.glb`** – 3D model for the configurator
5. **Upload** to configurator: GLB file + parameters.zip (or parameters.json alone for solid colors only)

## Output Format

```json
{
  "parameters": [...],
  "components": ["Top", "Bottom", "Legs", "Legs2"],
  "materials": {
    "oak": { "texturePath": "materials/oak.png" },
    "black": { "colorHex": "#1A1A1A" }
  }
}
```

Materials are extracted from the SketchUp model: **textured materials → PNG** in `materials/` (preferred), solid colors → `colorHex`. All model materials are exported (except `Layer_*`, `Default`). Dimension params (LenX, LenY, LenZ, width, etc.) are exported in **cm** (SketchUp API returns inches; plugin converts).

## Effect Types

| Type      | Description                    | Fields                          |
|-----------|--------------------------------|---------------------------------|
| `scale`   | Scale mesh on axis             | `meshNode`, `axis` (x, y, z, xz) |
| `position`| Position mesh (e.g. from formula) | `meshNode`, `axis`, `multiplier`, `subtractParam` (e.g. LenY), `offsetCm` (e.g. -2.54 for `parent!width-LenX-1`) |
| `material`| Material/color on mesh         | `meshNode`                      |
