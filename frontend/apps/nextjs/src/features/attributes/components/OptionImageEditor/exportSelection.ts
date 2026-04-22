export const OPTION_IMAGE_SIZE = 1024

export function exportSelectionAsPngBlob(imageData: ImageData, mask: Uint8Array): Promise<Blob> {
  const { width, height, data } = imageData
  const out = new ImageData(width, height)

  for (let i = 0; i < width * height; i++) {
    const srcIdx = i * 4
    const alpha = mask[i] ?? 0
    out.data[srcIdx] = data[srcIdx] ?? 0
    out.data[srcIdx + 1] = data[srcIdx + 1] ?? 0
    out.data[srcIdx + 2] = data[srcIdx + 2] ?? 0
    out.data[srcIdx + 3] = alpha
  }

  const tempCanvas = document.createElement("canvas")
  tempCanvas.width = width
  tempCanvas.height = height
  const tempCtx = tempCanvas.getContext("2d")
  if (!tempCtx) {
    return Promise.reject(new Error("Could not get canvas context"))
  }
  tempCtx.putImageData(out, 0, 0)

  const size = OPTION_IMAGE_SIZE
  const outCanvas = document.createElement("canvas")
  outCanvas.width = size
  outCanvas.height = size
  const ctx = outCanvas.getContext("2d")
  if (!ctx) {
    return Promise.reject(new Error("Could not get canvas context"))
  }
  ctx.clearRect(0, 0, size, size)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"
  const scale = Math.min(size / width, size / height)
  const drawW = Math.round(width * scale)
  const drawH = Math.round(height * scale)
  const dx = (size - drawW) / 2
  const dy = (size - drawH) / 2
  ctx.drawImage(tempCanvas, 0, 0, width, height, dx, dy, drawW, drawH)

  return new Promise((resolve, reject) => {
    outCanvas.toBlob(
      (blob: Blob | null) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error("Failed to create PNG blob"))
        }
      },
      "image/png",
      1,
    )
  })
}
