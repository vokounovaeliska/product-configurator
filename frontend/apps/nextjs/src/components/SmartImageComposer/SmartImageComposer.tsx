"use client"

import { useCallback, useState } from "react"
import Image from "next/image"

import { getImageUrl } from "@/utils/imageUrl"

export type ImageLayerItem = {
  id: string
  imageUrl: string
  zIndex: number
}

type Props = {
  layers: ImageLayerItem[]
  /** Max width/height for the composed preview; aspect ratio follows first loaded image or 1:1 */
  maxSize?: number
  className?: string
}

export const SmartImageComposer = ({ layers, maxSize = 400, className = "" }: Props) => {
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null)

  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex)

  const handleFirstLoad = useCallback(
    (width: number, height: number) => {
      setDimensions((prev) => {
        if (prev) return prev
        let w = width
        let h = height
        if (w > maxSize || h > maxSize) {
          const scale = maxSize / Math.max(w, h)
          w = Math.round(w * scale)
          h = Math.round(h * scale)
        }
        return { w, h }
      })
    },
    [maxSize],
  )

  if (sortedLayers.length === 0) {
    return null
  }

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: dimensions?.w ?? maxSize,
        height: dimensions?.h ?? maxSize,
        maxWidth: "100%",
        maxHeight: "100%",
      }}
    >
      {sortedLayers.map((layer) => (
        <LayerImage
          key={layer.id}
          imageUrl={getImageUrl(layer.imageUrl)}
          zIndex={layer.zIndex}
          containerSize={dimensions}
          maxSize={maxSize}
          onLoad={handleFirstLoad}
        />
      ))}
    </div>
  )
}

type LayerImageProps = {
  imageUrl: string
  zIndex: number
  containerSize: { w: number; h: number } | null
  maxSize: number
  onLoad: (width: number, height: number) => void
}

const LayerImage = ({
  imageUrl,
  zIndex,
  containerSize: _containerSize,
  maxSize,
  onLoad,
}: LayerImageProps) => {
  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget
      if (img.naturalWidth && img.naturalHeight) {
        let w = img.naturalWidth
        let h = img.naturalHeight
        if (w > maxSize || h > maxSize) {
          const scale = maxSize / Math.max(w, h)
          w = Math.round(w * scale)
          h = Math.round(h * scale)
        }
        onLoad(img.naturalWidth, img.naturalHeight)
      }
    },
    [maxSize, onLoad],
  )

  const style: React.CSSProperties = {
    objectFit: "contain",
    zIndex,
  }

  return (
    <Image
      src={imageUrl}
      alt=""
      fill
      style={style}
      onLoad={handleLoad}
      unoptimized
    />
  )
}
