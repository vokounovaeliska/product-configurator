import { getImageUrlForDisplay } from "@/utils/imageUrl"

export type PreviewLayer = {
  id: string
  imageUrl: string
  zIndex: number
}

export async function capture2DSnapshot(
  layers: PreviewLayer[],
  maxSize = 560,
): Promise<string | null> {
  if (layers.length === 0) return null

  const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex)

  const loadImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load: ${url}`))
      img.src = getImageUrlForDisplay(url)
    })

  try {
    const images = await Promise.all(sorted.map((layer) => loadImage(layer.imageUrl)))

    const first = images[0]!
    let w = first.naturalWidth
    let h = first.naturalHeight
    if (w > maxSize || h > maxSize) {
      const scale = maxSize / Math.max(w, h)
      w = Math.round(w * scale)
      h = Math.round(h * scale)
    }

    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    ctx.clearRect(0, 0, w, h)
    for (const img of images) {
      ctx.drawImage(img, 0, 0, w, h)
    }

    return canvas.toDataURL("image/png")
  } catch {
    return null
  }
}
