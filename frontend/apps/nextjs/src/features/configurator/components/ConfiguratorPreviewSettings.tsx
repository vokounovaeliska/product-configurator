"use client"

import { useCallback, useEffect, useState } from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Typography } from "@workspace/ui/components/typography"

import {
  useConfiguratorPreferences,
  usePatchConfiguratorPreferences,
} from "@/api/configuratorPreferencesQueries"
import { extractErrorMessage } from "@/lib/utils"

const ZOOM_MIN = 1
const ZOOM_MAX = 10
const ZOOM_STEP = 0.5
const ZOOM_DEFAULT = 2

type Props = {
  productModelId: string
  /** Live zoom from 3D viewer (updates when user zooms). When set, slider reflects current view. */
  liveZoomFromViewer?: number | null
  /** Called when user drags slider – parent should pass value to 3D viewer for live sync. */
  onSliderChange?: (value: number) => void
  /** Called when save succeeds – parent can clear slider override. */
  onSaveSuccess?: () => void
}

export const ConfiguratorPreviewSettings = ({
  productModelId,
  liveZoomFromViewer,
  onSliderChange,
  onSaveSuccess,
}: Props) => {
  const t = useTranslations("Configurator.previewSettings")
  const {
    data: preferences,
    isLoading,
    isError: isLoadError,
  } = useConfiguratorPreferences(productModelId)
  const patchPreferences = usePatchConfiguratorPreferences(productModelId)

  const savedZoom = preferences?.zoomDistanceDefault ?? null
  const initialZoom =
    savedZoom != null ? Math.min(Math.max(savedZoom, ZOOM_MIN), ZOOM_MAX) : ZOOM_DEFAULT

  const [zoomValue, setZoomValue] = useState(initialZoom)
  const [inputValue, setInputValue] = useState(String(initialZoom))
  const [isSliderDragging, setIsSliderDragging] = useState(false)

  const displayZoom = isSliderDragging ? zoomValue : (liveZoomFromViewer ?? zoomValue)

  useEffect(() => {
    if (isSliderDragging) return
    const v =
      liveZoomFromViewer != null
        ? Math.min(Math.max(liveZoomFromViewer, ZOOM_MIN), ZOOM_MAX)
        : savedZoom != null
          ? Math.min(Math.max(savedZoom, ZOOM_MIN), ZOOM_MAX)
          : ZOOM_DEFAULT
    setZoomValue(v)
    setInputValue(String(v))
  }, [savedZoom, liveZoomFromViewer, isSliderDragging])

  const clampedZoom = Math.min(Math.max(zoomValue, ZOOM_MIN), ZOOM_MAX)
  const displayClamped = Math.min(Math.max(displayZoom, ZOOM_MIN), ZOOM_MAX)
  const hasChanges = Math.abs(clampedZoom - (savedZoom ?? ZOOM_DEFAULT)) > 0.01
  const isSaving = patchPreferences.isPending

  const handleSliderChange = useCallback(
    (values: number[]) => {
      const v = values[0] ?? ZOOM_MIN
      const clamped = Math.min(Math.max(v, ZOOM_MIN), ZOOM_MAX)
      setZoomValue(clamped)
      setInputValue(String(clamped))
      setIsSliderDragging(true)
      onSliderChange?.(clamped)
    },
    [onSliderChange],
  )

  const handleSliderCommit = useCallback(() => {
    setIsSliderDragging(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    const n = Number.parseFloat(e.target.value)
    if (!Number.isNaN(n)) {
      setZoomValue(Math.min(Math.max(n, ZOOM_MIN), ZOOM_MAX))
    }
  }, [])

  const handleInputBlur = useCallback(() => {
    const n = Number.parseFloat(inputValue)
    const v = Number.isNaN(n) ? clampedZoom : Math.min(Math.max(n, ZOOM_MIN), ZOOM_MAX)
    setZoomValue(v)
    setInputValue(String(v))
    onSliderChange?.(v)
  }, [inputValue, clampedZoom, onSliderChange])

  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSave = useCallback(() => {
    if (!hasChanges) return
    setSaveError(null)
    patchPreferences.mutate(
      { zoomDistanceDefault: Math.round(clampedZoom * 100) / 100 },
      {
        onSuccess: () => {
          setZoomValue(clampedZoom)
          setInputValue(String(clampedZoom))
          setSaveError(null)
          onSaveSuccess?.()
        },
        onError: (error) => {
          void extractErrorMessage(error).then(setSaveError)
        },
      },
    )
  }, [hasChanges, clampedZoom, patchPreferences, onSaveSuccess])

  if (isLoading) return null

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">{t("title")}</h3>
        <p className="text-sm text-muted-foreground">{t("description")}</p>

        {isLoadError && (
          <Typography
            as="p"
            variant="body-sm"
            className="text-muted-foreground"
          >
            {t("loadError")}
          </Typography>
        )}

        <div className="space-y-2">
          <Label htmlFor="preview-zoom">{t("zoomLabel")}</Label>
          <div className="flex items-center gap-3">
            <SliderPrimitive.Root
              className="relative flex flex-1 touch-none items-center select-none"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={ZOOM_STEP}
              value={[displayClamped]}
              onValueChange={handleSliderChange}
              onValueCommit={handleSliderCommit}
              aria-label={t("zoomLabel")}
            >
              <SliderPrimitive.Track className="relative h-2 w-full grow rounded-full bg-muted">
                <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary/30" />
              </SliderPrimitive.Track>
              <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-primary bg-background shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" />
            </SliderPrimitive.Root>
            <Input
              id="preview-zoom"
              type="number"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={ZOOM_STEP}
              className="w-16 shrink-0"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              aria-label={t("zoomLabel")}
            />
          </div>
        </div>

        {saveError && (
          <Typography
            as="p"
            variant="body-sm"
            className="text-destructive"
          >
            {saveError}
          </Typography>
        )}

        <Button
          size="sm"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? t("saving") : t("save")}
        </Button>
      </div>
    </Card>
  )
}
