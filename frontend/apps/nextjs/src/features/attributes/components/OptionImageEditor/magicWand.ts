/**
 * Magic wand selection using magic-wand-tool (flood-fill by color similarity).
 * Converts ImageData + click → mask (Uint8Array, 255 = selected, 0 = not selected).
 */

import { floodFill } from "magic-wand-tool"

/**
 * Computes a selection mask from canvas ImageData using magic-wand-tool's flood fill.
 * @param imageData - RGBA ImageData from canvas
 * @param startX - Click x in image coordinates
 * @param startY - Click y in image coordinates
 * @param tolerance - Color threshold (0–255); library uses per-channel difference
 * @returns Mask with 255 = selected, 0 = not selected (same dimensions as imageData)
 */
export function computeMagicWandMask(
  imageData: ImageData,
  startX: number,
  startY: number,
  tolerance: number,
): Uint8Array {
  const { data, width, height } = imageData

  const image = {
    data: new Uint8Array(data),
    width,
    height,
    bytes: 4,
  }

  const px = Math.max(0, Math.min(width - 1, Math.floor(startX)))
  const py = Math.max(0, Math.min(height - 1, Math.floor(startY)))

  const result = floodFill(image, px, py, Math.min(255, Math.max(0, tolerance)), undefined, true)

  if (!result?.data) {
    const fallback = new Uint8Array(width * height)
    const idx = py * width + px
    if (idx >= 0 && idx < fallback.length) fallback[idx] = 255
    return fallback
  }

  // Library returns 1 for the flood-filled region (the pixel you clicked + similar colors).
  // 255 = selected (highlighted, kept on save), 0 = not selected (gray overlay, transparent on save).
  const mask = new Uint8Array(result.data.length)
  let hasAny = false
  for (let i = 0; i < result.data.length; i++) {
    const v = (result.data[i] ?? 0) ? 255 : 0
    mask[i] = v
    if (v) hasAny = true
  }
  if (!hasAny && width > 0 && height > 0) {
    const idx = py * width + px
    if (idx >= 0 && idx < mask.length) mask[idx] = 255
  }
  return mask
}
