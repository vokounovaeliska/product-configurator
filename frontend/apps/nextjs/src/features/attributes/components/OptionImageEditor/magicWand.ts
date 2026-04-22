import { floodFill } from "magic-wand-tool"

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
