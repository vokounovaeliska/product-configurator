export function applyBrushToMask(
  mask: Uint8Array | null,
  width: number,
  height: number,
  centerX: number,
  centerY: number,
  radius: number,
  isAdd: boolean,
): Uint8Array {
  const size = width * height
  const out = mask?.length === size ? new Uint8Array(mask) : new Uint8Array(size)
  const r = Math.max(0, Math.floor(radius))
  const value = isAdd ? 255 : 0
  const minX = Math.max(0, Math.floor(centerX - r))
  const maxX = Math.min(width - 1, Math.floor(centerX + r))
  const minY = Math.max(0, Math.floor(centerY - r))
  const maxY = Math.min(height - 1, Math.floor(centerY + r))
  const rSq = r * r
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x - centerX
      const dy = y - centerY
      if (dx * dx + dy * dy <= rSq) {
        out[y * width + x] = value
      }
    }
  }
  return out
}

export function mergeMasks(
  a: Uint8Array | null,
  b: Uint8Array | null,
  width: number,
  height: number,
): Uint8Array {
  const size = width * height
  if (a?.length !== size) return b?.length === size ? new Uint8Array(b) : new Uint8Array(size)
  if (b?.length !== size) return new Uint8Array(a)
  const out = new Uint8Array(size)
  for (let i = 0; i < size; i++) {
    out[i] = (a[i] ?? 0) > 0 || (b[i] ?? 0) > 0 ? 255 : 0
  }
  return out
}

export function invertMask(mask: Uint8Array | null, width: number, height: number): Uint8Array {
  const size = width * height
  const out = new Uint8Array(size)
  if (mask?.length !== size) {
    out.fill(255)
    return out
  }
  for (let i = 0; i < size; i++) {
    out[i] = (mask[i] ?? 0) > 0 ? 0 : 255
  }
  return out
}

type Point = { x: number; y: number }

export function polygonToMask(points: Point[], width: number, height: number): Uint8Array {
  const mask = new Uint8Array(width * height)
  if (points.length < 3) return mask

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) return mask

  const first = points[0]
  if (!first) return mask
  ctx.fillStyle = "white"
  ctx.beginPath()
  ctx.moveTo(first.x, first.y)
  for (let i = 1; i < points.length; i++) {
    const p = points[i]
    if (p) ctx.lineTo(p.x, p.y)
  }
  ctx.closePath()
  ctx.fill()

  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4
    mask[i] = (data[idx] ?? 0) > 0 ? 255 : 0
  }
  return mask
}
