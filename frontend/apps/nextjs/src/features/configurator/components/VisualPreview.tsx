"use client"

import type { MutableRefObject } from "react"
import { useTranslations } from "next-intl"
import { Card } from "@workspace/ui/components/card"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import type { CameraAnglesGetter } from "@/api/configuratorPreferencesTypes"
import { SmartImageComposer } from "@/components/SmartImageComposer"

import type { Model3dConfig } from "@/features/configurator/types/model3dConfig"

import { ModelViewer3D } from "./ModelViewer3DWrapper"

export type PreviewLayer = {
  id: string
  imageUrl: string
  zIndex: number
}

type Props = {
  productModelId: string
  selectedComponentId: string | null
  selectedOptionLayers?: PreviewLayer[]
  model3dUrl?: string | null
  model3dConfig?: Model3dConfig | null
  model3dEffects?: string | null
  configuratorPreferencesFromServer?: {
    zoomDistanceDefault?: number | null
    zoomDistanceEmbed?: number | null
    backgroundPreset?: string | null
    cameraHorizontalAngleRad?: number | null
    cameraVerticalAngleRad?: number | null
  } | null
  cameraDistanceOverride?: number | null
  backgroundPresetOverride?: string | null
  onCameraDistanceChange?: (distance: number) => void
  canCapture?: boolean
  onCaptureReady?: (capture: () => Promise<string | null>) => void
  isCompact?: boolean
  embedPreview?: boolean
  cameraAnglesGetterRef?: MutableRefObject<CameraAnglesGetter | null>
}

export const VisualPreview = ({
  productModelId,
  selectedComponentId,
  selectedOptionLayers = [],
  model3dUrl,
  model3dConfig,
  model3dEffects,
  configuratorPreferencesFromServer,
  cameraDistanceOverride,
  backgroundPresetOverride,
  onCameraDistanceChange,
  canCapture,
  onCaptureReady,
  isCompact = false,
  embedPreview: isEmbedPreview = false,
  cameraAnglesGetterRef,
}: Props) => {
  const t = useTranslations("Configurator")

  const layerItems = selectedOptionLayers
  const has3dModel = Boolean(model3dUrl?.trim())

  if (has3dModel) {
    const isCompactLayout = isCompact && !isEmbedPreview
    return (
      <Card
        className={cn(
          "flex flex-col overflow-hidden",
          isCompactLayout
            ? "min-h-0 flex-1 p-2 sm:p-3"
            : isEmbedPreview
              ? "h-full w-full flex-1 border-0 bg-transparent p-0 shadow-none"
              : "min-h-0 flex-1 p-4 md:p-6",
        )}
        data-embed-preview
      >
        <div
          className={cn(
            "rounded-lg",
            isEmbedPreview
              ? "relative flex min-h-[220px] w-full flex-1 flex-col overflow-hidden bg-transparent md:h-full md:min-h-0"
              : cn(
                  "flex min-h-0 flex-1 items-center justify-center border bg-muted/30",
                  isCompactLayout
                    ? "max-h-[55vh] min-h-[30vh] sm:max-h-[60vh] sm:min-h-[40vh] md:min-h-[50vh]"
                    : "max-h-[60vh] min-h-[40vh]",
                ),
          )}
        >
          <ModelViewer3D
            modelUrl={model3dUrl!}
            productModelId={productModelId}
            configuratorPreferencesFromServer={configuratorPreferencesFromServer}
            cameraDistanceOverride={cameraDistanceOverride}
            backgroundPresetOverride={backgroundPresetOverride}
            onCameraDistanceChange={onCameraDistanceChange}
            className={cn(isEmbedPreview ? "h-full min-h-0 flex-1 rounded-xl" : "rounded-lg")}
            config={model3dConfig}
            model3dEffects={model3dEffects}
            zoomPreset={isEmbedPreview ? "embed" : isCompact ? "embed" : "default"}
            canCapture={canCapture}
            onCaptureReady={onCaptureReady}
            cameraAnglesGetterRef={cameraAnglesGetterRef}
          />
        </div>
      </Card>
    )
  }

  if (!selectedComponentId && layerItems.length === 0) {
    return (
      <Card className="flex h-full min-h-[40vh] flex-1 items-center justify-center p-10">
        <Typography
          as="p"
          variant="body-md"
          className="text-muted-foreground"
        >
          {t("preview.selectComponent")}
        </Typography>
      </Card>
    )
  }

  if (layerItems.length === 0) {
    return (
      <Card className="flex h-full min-h-[40vh] flex-1 items-center justify-center p-10">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-lg bg-muted">
            <Typography
              as="p"
              variant="body-md"
              className="text-muted-foreground"
            >
              {t("preview.placeholder")}
            </Typography>
          </div>
          <Typography
            as="p"
            variant="body-sm"
            className="text-muted-foreground"
          >
            {t("preview.selectOptions")}
          </Typography>
        </div>
      </Card>
    )
  }

  return (
    <Card className="flex h-full min-h-0 flex-1 flex-col overflow-hidden p-4 md:p-6">
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <SmartImageComposer
          layers={layerItems}
          maxSize={560}
          className="rounded-lg border bg-muted/30"
        />
      </div>
    </Card>
  )
}
