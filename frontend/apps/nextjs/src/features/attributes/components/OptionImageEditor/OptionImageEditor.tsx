"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  CheckIcon,
  CircleMinusIcon,
  EraserIcon,
  FlipHorizontalIcon,
  LassoIcon,
  PaintbrushIcon,
  Wand2Icon,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Dialog } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Typography } from "@workspace/ui/components/typography"

import { api } from "@/lib/api/restClient"
import type { TFunction } from "@/types/tFunction"

import { exportSelectionAsPngBlob } from "./exportSelection"
import { computeMagicWandMask } from "./magicWand"
import { applyBrushToMask, invertMask, mergeMasks, polygonToMask } from "./maskUtils"

type ToolMode = "magic-wand" | "lasso" | "brush-add" | "brush-remove"

const DISPLAY_SCALE = 2

type Props = {
  sourceImageUrl: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (imageUrl: string) => void
  onError?: (message: string) => void

  t: TFunction<"OptionImageEditor">
}

export const OptionImageEditor = ({
  sourceImageUrl,
  isOpen,
  onOpenChange,
  onComplete,
  onError,
  t,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const originalImageDataRef = useRef<ImageData | null>(null)

  const [isImageLoaded, setIsImageLoaded] = useState(false)
  const [isImageDataReady, setIsImageDataReady] = useState(false)
  const [mask, setMask] = useState<Uint8Array | null>(null)
  const [tolerance, setTolerance] = useState(48)
  const [isExporting, setIsExporting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [toolMode, setToolMode] = useState<ToolMode>("magic-wand")
  const [lassoPoints, setLassoPoints] = useState<{ x: number; y: number }[]>([])
  const [brushSize, setBrushSize] = useState(16)
  const isDrawingRef = useRef(false)

  const widthRef = useRef(0)
  const heightRef = useRef(0)
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadSettledRef = useRef(false)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img || !isImageLoaded) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const w = widthRef.current
    const h = heightRef.current
    const cw = w * DISPLAY_SCALE
    const ch = h * DISPLAY_SCALE
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw
      canvas.height = ch
    }
    ctx.clearRect(0, 0, cw, ch)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(img, 0, 0, cw, ch)

    const currentMask = mask
    if (currentMask?.length === w * h) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)"
      ctx.fillRect(0, 0, cw, ch)
      const punchData = ctx.createImageData(cw, ch)
      for (let py = 0; py < ch; py++) {
        for (let px = 0; px < cw; px++) {
          const i = Math.floor(py / DISPLAY_SCALE) * w + Math.floor(px / DISPLAY_SCALE)
          const isSelected = (currentMask[i] ?? 0) > 0
          const idx = (py * cw + px) * 4
          punchData.data[idx] = 0
          punchData.data[idx + 1] = 0
          punchData.data[idx + 2] = 0
          punchData.data[idx + 3] = isSelected ? 255 : 0
        }
      }
      const punchCanvas = document.createElement("canvas")
      punchCanvas.width = cw
      punchCanvas.height = ch
      const punchCtx = punchCanvas.getContext("2d")
      if (punchCtx) {
        punchCtx.putImageData(punchData, 0, 0)
        ctx.globalCompositeOperation = "destination-out"
        ctx.drawImage(punchCanvas, 0, 0)
        ctx.globalCompositeOperation = "source-over"
      }
      const tintData = ctx.createImageData(cw, ch)
      for (let py = 0; py < ch; py++) {
        for (let px = 0; px < cw; px++) {
          const i = Math.floor(py / DISPLAY_SCALE) * w + Math.floor(px / DISPLAY_SCALE)
          const isSelected = (currentMask[i] ?? 0) > 0
          const idx = (py * cw + px) * 4
          tintData.data[idx] = 0
          tintData.data[idx + 1] = 200
          tintData.data[idx + 2] = 255
          tintData.data[idx + 3] = isSelected ? 51 : 0
        }
      }
      const tintCanvas = document.createElement("canvas")
      tintCanvas.width = cw
      tintCanvas.height = ch
      const tintCtx = tintCanvas.getContext("2d")
      if (tintCtx) {
        tintCtx.putImageData(tintData, 0, 0)
        ctx.drawImage(tintCanvas, 0, 0)
      }
    }

    if (toolMode === "lasso" && lassoPoints.length >= 2) {
      const first = lassoPoints[0]
      if (first) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)"
        ctx.lineWidth = DISPLAY_SCALE * 2
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(first.x * DISPLAY_SCALE, first.y * DISPLAY_SCALE)
        for (let i = 1; i < lassoPoints.length; i++) {
          const p = lassoPoints[i]
          if (p) ctx.lineTo(p.x * DISPLAY_SCALE, p.y * DISPLAY_SCALE)
        }
        ctx.stroke()
        ctx.setLineDash([])
      }
    }
  }, [isImageLoaded, mask, toolMode, lassoPoints])

  const IMAGE_LOAD_TIMEOUT_MS = 15_000

  useEffect(() => {
    if (!isOpen || !sourceImageUrl) return

    setLoadError(null)
    setIsImageLoaded(false)
    setIsImageDataReady(false)
    setMask(null)
    setLassoPoints([])
    setToolMode("magic-wand")
    loadSettledRef.current = false

    const img = new Image()
    img.crossOrigin = "anonymous"

    loadTimeoutRef.current = setTimeout(() => {
      if (loadSettledRef.current) return
      loadSettledRef.current = true
      setLoadError(t("errors.loadTimeout"))
      img.src = ""
    }, IMAGE_LOAD_TIMEOUT_MS)

    img.onload = () => {
      if (loadSettledRef.current) return
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
        loadTimeoutRef.current = null
      }
      loadSettledRef.current = true

      imageRef.current = img
      const w = img.naturalWidth
      const h = img.naturalHeight
      widthRef.current = w
      heightRef.current = h
      setIsImageLoaded(true)

      const preparePixelData = () => {
        const offscreen = document.createElement("canvas")
        offscreen.width = w
        offscreen.height = h
        const offCtx = offscreen.getContext("2d")
        if (offCtx) {
          offCtx.drawImage(img, 0, 0, w, h)
          try {
            originalImageDataRef.current = offCtx.getImageData(0, 0, w, h)
          } catch {
            setLoadError(t("errors.corsOrTainted"))
            originalImageDataRef.current = null
          }
        }
        setIsImageDataReady(true)
      }

      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(preparePixelData, { timeout: 100 })
      } else {
        setTimeout(preparePixelData, 0)
      }
    }
    img.onerror = () => {
      if (loadSettledRef.current) return
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
        loadTimeoutRef.current = null
      }
      loadSettledRef.current = true
      setLoadError(t("errors.loadFailed"))
    }
    img.src = sourceImageUrl

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
        loadTimeoutRef.current = null
      }
      img.onload = null
      img.onerror = null
      img.src = ""
    }
  }, [isOpen, sourceImageUrl, t])

  useEffect(() => {
    draw()
  }, [draw])

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const canvasX = Math.floor((e.clientX - rect.left) * scaleX)
    const canvasY = Math.floor((e.clientY - rect.top) * scaleY)
    const w = widthRef.current
    const h = heightRef.current
    const x = Math.floor(canvasX / DISPLAY_SCALE)
    const y = Math.floor(canvasY / DISPLAY_SCALE)
    if (x < 0 || x >= w || y < 0 || y >= h) return null
    return { x, y }
  }, [])

  const applyBrushAt = useCallback(
    (x: number, y: number) => {
      const w = widthRef.current
      const h = heightRef.current
      const isAdd = toolMode === "brush-add"
      setMask((prev) => applyBrushToMask(prev, w, h, x, y, brushSize, isAdd))
    },
    [toolMode, brushSize],
  )

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isImageLoaded || !isImageDataReady || !originalImageDataRef.current) return
      const coords = getCanvasCoords(e)
      if (!coords) return
      const { x, y } = coords
      const w = widthRef.current
      const h = heightRef.current

      if (toolMode === "brush-add" || toolMode === "brush-remove") {
        isDrawingRef.current = true
        applyBrushAt(x, y)
        return
      }
      if (toolMode === "magic-wand") {
        const imageData = originalImageDataRef.current
        const newMask = computeMagicWandMask(imageData, x, y, tolerance)
        if (e.shiftKey) {
          setMask((prev) => mergeMasks(prev, newMask, w, h))
        } else {
          setMask(newMask)
        }
        setLassoPoints([])
      } else if (toolMode === "lasso") {
        setLassoPoints((prev) => [...prev, { x, y }])
      }
    },
    [isImageLoaded, isImageDataReady, tolerance, toolMode, getCanvasCoords, applyBrushAt],
  )

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) return
      const coords = getCanvasCoords(e)
      if (!coords) return
      applyBrushAt(coords.x, coords.y)
    },
    [getCanvasCoords, applyBrushAt],
  )

  const handleCanvasMouseUp = useCallback(() => {
    isDrawingRef.current = false
  }, [])

  const handleCanvasMouseLeave = useCallback(() => {
    isDrawingRef.current = false
  }, [])

  const handleClearSelection = useCallback(() => {
    setMask(null)
    setLassoPoints([])
  }, [])

  const handleInvertSelection = useCallback(() => {
    const w = widthRef.current
    const h = heightRef.current
    setMask((prev) => invertMask(prev, w, h))
    setLassoPoints([])
  }, [])

  const handleClosePolygon = useCallback(() => {
    if (lassoPoints.length < 3) return
    const w = widthRef.current
    const h = heightRef.current
    const newMask = polygonToMask(lassoPoints, w, h)
    setMask(newMask)
    setLassoPoints([])
  }, [lassoPoints])

  const handleUseAsOptionImage = useCallback(async () => {
    const imageData = originalImageDataRef.current
    const currentMask = mask
    if (!imageData || currentMask?.length !== imageData.width * imageData.height) {
      onError?.(t("errors.noSelection"))
      return
    }

    setIsExporting(true)
    try {
      const blob = await exportSelectionAsPngBlob(imageData, currentMask)
      const formData = new FormData()
      formData.append("file", blob, "option-image.png")

      const response = await api
        .post("api/v1/files/upload", { body: formData })
        .json<{ success: boolean; message: string; url: string | null }>()

      if (response.success && response.url) {
        const apiBaseUrl = process.env.NEXT_PUBLIC_REST_API_URL ?? ""
        const fullUrl = response.url.startsWith("http")
          ? response.url
          : `${apiBaseUrl}${response.url}`
        onComplete(fullUrl)
        onOpenChange(false)
      } else {
        onError?.(response.message ?? t("errors.uploadFailed"))
      }
    } catch (error) {
      console.error("Export/upload error:", error)
      onError?.(t("errors.uploadFailed"))
    } finally {
      setIsExporting(false)
    }
  }, [mask, onComplete, onError, onOpenChange, t])

  const hasSelection = Boolean(mask?.some((v) => v > 0))

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <Dialog.Content className="flex max-h-[90vh] max-w-6xl flex-col overflow-hidden p-0">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 space-y-1 px-6 pt-6">
            <Dialog.Content.Header>
              <Dialog.Content.Header.Title>{t("title")}</Dialog.Content.Header.Title>
              <Dialog.Content.Header.Description>
                {t("description")}
              </Dialog.Content.Header.Description>
            </Dialog.Content.Header>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {loadError && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <Typography
                  as="p"
                  variant="body-sm"
                  className="text-destructive"
                >
                  {loadError}
                </Typography>
              </div>
            )}

            {isImageLoaded && !loadError && (
              <>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={toolMode === "magic-wand" ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => {
                          setToolMode("magic-wand")
                          setLassoPoints([])
                        }}
                      >
                        <Wand2Icon className="size-4" />
                        {t("toolMagicWand")}
                      </Button>
                      <Button
                        type="button"
                        variant={toolMode === "lasso" ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => {
                          setToolMode("lasso")
                          setLassoPoints([])
                        }}
                      >
                        <LassoIcon className="size-4" />
                        {t("toolLasso")}
                      </Button>
                      <Button
                        type="button"
                        variant={toolMode === "brush-add" ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => {
                          setToolMode("brush-add")
                          setLassoPoints([])
                        }}
                      >
                        <PaintbrushIcon className="size-4" />
                        {t("toolBrushAdd")}
                      </Button>
                      <Button
                        type="button"
                        variant={toolMode === "brush-remove" ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => {
                          setToolMode("brush-remove")
                          setLassoPoints([])
                        }}
                      >
                        <CircleMinusIcon className="size-4" />
                        {t("toolBrushRemove")}
                      </Button>
                    </div>
                    {(toolMode === "brush-add" || toolMode === "brush-remove") && (
                      <div className="w-28 space-y-1">
                        <Label htmlFor="option-editor-brush-size">{t("brushSize")}</Label>
                        <Input
                          id="option-editor-brush-size"
                          type="number"
                          min={4}
                          max={80}
                          value={brushSize}
                          onChange={(e) => {
                            const v = Number.parseInt(e.target.value, 10)
                            if (!Number.isNaN(v)) setBrushSize(Math.min(80, Math.max(4, v)))
                          }}
                        />
                      </div>
                    )}
                    {toolMode === "magic-wand" && (
                      <div className="w-32 space-y-1">
                        <Label htmlFor="option-editor-tolerance">{t("tolerance")}</Label>
                        <Input
                          id="option-editor-tolerance"
                          type="number"
                          min={1}
                          max={255}
                          value={tolerance}
                          onChange={(e) => {
                            const v = Number.parseInt(e.target.value, 10)
                            if (!Number.isNaN(v)) setTolerance(Math.min(255, Math.max(1, v)))
                          }}
                        />
                      </div>
                    )}
                    {toolMode === "lasso" && lassoPoints.length >= 3 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleClosePolygon}
                      >
                        {t("closePolygon")}
                      </Button>
                    )}
                    <div className="ml-auto flex gap-2 sm:ml-0 sm:flex-1 sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleInvertSelection}
                        disabled={!hasSelection && lassoPoints.length === 0}
                      >
                        <FlipHorizontalIcon className="size-4" />
                        {t("invertSelection")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleClearSelection}
                        disabled={!hasSelection && lassoPoints.length === 0}
                      >
                        <EraserIcon className="size-4" />
                        {t("clearSelection")}
                      </Button>
                    </div>
                  </div>
                  <Typography
                    as="p"
                    variant="body-sm"
                    className="mt-3 text-muted-foreground"
                  >
                    {toolMode === "magic-wand" && (
                      <>
                        {t("clickHint")} {t("magicWandShiftHint")}
                      </>
                    )}
                    {toolMode === "lasso" && t("lassoHint")}
                    {(toolMode === "brush-add" || toolMode === "brush-remove") && t("brushHint")}
                  </Typography>
                </div>

                <div className="relative flex min-h-[min(50vh,420px)] items-center justify-center overflow-auto rounded-lg border bg-muted/30 p-2">
                  {!isImageDataReady && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60">
                      <Typography
                        as="p"
                        variant="body-sm"
                        className="text-muted-foreground"
                      >
                        {t("preparing")}
                      </Typography>
                    </div>
                  )}
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseLeave}
                    className="max-h-[min(50vh,400px)] w-auto max-w-full cursor-crosshair object-contain select-none"
                    style={{ maxWidth: "100%" }}
                    role="img"
                    aria-label={t("canvasAriaLabel")}
                  />
                </div>
              </>
            )}

            {!isImageLoaded && !loadError && (
              <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-dashed bg-muted/30">
                <Typography
                  as="p"
                  variant="body-md"
                  className="text-muted-foreground"
                >
                  {t("loading")}
                </Typography>
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t bg-background px-6 py-4">
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              className="shrink-0"
              onClick={handleUseAsOptionImage}
              disabled={!hasSelection || isExporting}
            >
              {isExporting ? (
                t("exporting")
              ) : (
                <>
                  <CheckIcon className="size-4 shrink-0" />
                  {t("useAsOptionImage")}
                </>
              )}
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  )
}
