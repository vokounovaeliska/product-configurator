"use client"

import { useCallback, useEffect, useState } from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Label } from "@workspace/ui/components/label"
import { Select } from "@workspace/ui/components/select"
import { Typography } from "@workspace/ui/components/typography"

import {
  useConfiguratorPreferences,
  usePatchConfiguratorPreferences,
} from "@/api/configuratorPreferencesQueries"
import { extractErrorMessage } from "@/lib/utils"

import {
  BACKGROUND_PRESETS,
  type BackgroundPresetKey,
} from "@/features/configurator/components/ModelViewer3D"

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
  /** Called when user selects background – parent should pass value to 3D viewer for live sync. */
  onBackgroundChange?: (value: string) => void
  /** Called when save succeeds – parent can clear slider/background override. */
  onSaveSuccess?: () => void
}

export const ConfiguratorPreviewSettings = ({
  productModelId,
  liveZoomFromViewer,
  onSliderChange,
  onBackgroundChange,
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
  const savedBackground = (preferences?.backgroundPreset as BackgroundPresetKey) ?? "lightGray"
  const initialZoom =
    savedZoom != null ? Math.min(Math.max(savedZoom, ZOOM_MIN), ZOOM_MAX) : ZOOM_DEFAULT

  const [zoomValue, setZoomValue] = useState(initialZoom)
  const [isSliderDragging, setIsSliderDragging] = useState(false)
  const [backgroundValue, setBackgroundValue] = useState<BackgroundPresetKey>(savedBackground)
  const [isOpen, setIsOpen] = useState(false)

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
  }, [savedZoom, liveZoomFromViewer, isSliderDragging])

  useEffect(() => {
    setBackgroundValue(savedBackground)
  }, [savedBackground])

  const clampedZoom = Math.min(Math.max(zoomValue, ZOOM_MIN), ZOOM_MAX)
  const displayClamped = Math.min(Math.max(displayZoom, ZOOM_MIN), ZOOM_MAX)
  const hasZoomChanged = Math.abs(clampedZoom - (savedZoom ?? ZOOM_DEFAULT)) > 0.01
  const hasBackgroundChanged = backgroundValue !== savedBackground
  const hasChanges = hasZoomChanged || hasBackgroundChanged
  const isSaving = patchPreferences.isPending

  const handleSliderChange = useCallback(
    (values: number[]) => {
      const v = values[0] ?? ZOOM_MIN
      const clamped = Math.min(Math.max(v, ZOOM_MIN), ZOOM_MAX)
      setZoomValue(clamped)
      setIsSliderDragging(true)
      onSliderChange?.(clamped)
    },
    [onSliderChange],
  )

  const handleSliderCommit = useCallback(() => {
    setIsSliderDragging(false)
  }, [])

  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSave = useCallback(() => {
    if (!hasChanges) return
    setSaveError(null)
    patchPreferences.mutate(
      {
        zoomDistanceDefault: Math.round(clampedZoom * 100) / 100,
        backgroundPreset: backgroundValue,
      },
      {
        onSuccess: () => {
          setZoomValue(clampedZoom)
          setBackgroundValue(backgroundValue)
          setSaveError(null)
          onSaveSuccess?.()
        },
        onError: (error) => {
          void extractErrorMessage(error).then(setSaveError)
        },
      },
    )
  }, [hasChanges, clampedZoom, backgroundValue, patchPreferences, onSaveSuccess])

  if (isLoading) return null

  return (
    <Card className="p-3">
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-2 rounded-sm hover:bg-muted/50"
          aria-expanded={isOpen}
        >
          <h3 className="text-sm font-semibold">{t("title")}</h3>
          <span className="flex items-center gap-1">
            {isOpen ? (
              <ChevronUpIcon className="size-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
            )}
          </span>
        </button>

        {isOpen && (
          <>
            {isLoadError && (
              <Typography
                as="p"
                variant="body-sm"
                className="text-muted-foreground"
              >
                {t("loadError")}
              </Typography>
            )}

            <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
              <div className="min-w-0 flex-1 space-y-1">
                <Label
                  htmlFor="preview-background"
                  className="text-xs"
                >
                  {t("backgroundLabel")}
                </Label>
                <Select
                  value={backgroundValue}
                  onValueChange={(v) => {
                    const key = v as BackgroundPresetKey
                    setBackgroundValue(key)
                    onBackgroundChange?.(key)
                  }}
                >
                  <Select.Trigger
                    id="preview-background"
                    className="h-8 text-sm"
                  >
                    <Select.Trigger.Value />
                  </Select.Trigger>
                  <Select.Content>
                    {(Object.keys(BACKGROUND_PRESETS) as BackgroundPresetKey[]).map((key) => (
                      <Select.Content.Item
                        key={key}
                        value={key}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 shrink-0 rounded border"
                            style={{
                              backgroundColor: BACKGROUND_PRESETS[key].previewColor,
                            }}
                          />
                          {t(`backgroundPresets.${key}` as "backgroundPresets.gray")}
                        </span>
                      </Select.Content.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <Label
                  htmlFor="preview-zoom"
                  className="text-xs"
                >
                  {t("zoomLabel")}
                </Label>
                <SliderPrimitive.Root
                  id="preview-zoom"
                  className="relative flex w-full touch-none items-center select-none"
                  min={ZOOM_MIN}
                  max={ZOOM_MAX}
                  step={ZOOM_STEP}
                  value={[displayClamped]}
                  onValueChange={handleSliderChange}
                  onValueCommit={handleSliderCommit}
                  aria-label={t("zoomLabel")}
                >
                  <SliderPrimitive.Track className="relative h-1.5 w-full grow rounded-full bg-muted">
                    <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary/30" />
                  </SliderPrimitive.Track>
                  <SliderPrimitive.Thumb className="block h-3 w-3 rounded-full border-2 border-primary bg-background shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" />
                </SliderPrimitive.Root>
              </div>
            </div>

            {hasChanges && (
              <Button
                size="sm"
                variant="secondary"
                className="h-7 px-2 text-xs"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? t("saving") : t("save")}
              </Button>
            )}

            {saveError && (
              <Typography
                as="p"
                variant="body-sm"
                className="text-destructive"
              >
                {saveError}
              </Typography>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
