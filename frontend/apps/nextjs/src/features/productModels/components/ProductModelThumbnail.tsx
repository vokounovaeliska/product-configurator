"use client"

import { Box } from "lucide-react"
import { useTranslations } from "next-intl"
import dynamic from "next/dynamic"
import { cn } from "@workspace/ui/lib/utils"

import { SmartImageComposer } from "@/components/SmartImageComposer"

import { useDefaultPreviewLayers } from "../hooks/useDefaultPreviewLayers"

/* eslint-disable import/no-restricted-paths -- product model card displays 3D preview from configurator */
const ModelViewer3D = dynamic(
  () =>
    import("@/features/configurator/components/ModelViewer3DWrapper").then((m) => m.ModelViewer3D),
  { ssr: false, loading: () => <ProductModelThumbnailSkeleton /> },
)
/* eslint-enable import/no-restricted-paths */

function ProductModelThumbnailSkeleton() {
  return (
    <div className="flex h-full min-h-[7rem] w-full items-center justify-center rounded-lg border bg-muted/30">
      <div className="h-4 w-16 animate-pulse rounded bg-muted" />
    </div>
  )
}

type Props = {
  productModelId: string
  model3dUrl?: string | null
  model3dEffects?: string | null
  className?: string
}

export const ProductModelThumbnail = ({
  productModelId,
  model3dUrl,
  model3dEffects,
  className,
}: Props) => {
  const t = useTranslations("ProductModels.card")
  const has3dModel = Boolean(model3dUrl?.trim())

  const { layers, isLoading } = useDefaultPreviewLayers(productModelId, !has3dModel)

  if (has3dModel) {
    return (
      <div
        className={cn(
          "relative h-28 w-full overflow-hidden rounded-lg border bg-muted/30",
          className,
        )}
      >
        <ModelViewer3D
          modelUrl={model3dUrl!}
          model3dEffects={model3dEffects ?? undefined}
          zoomPreset="thumbnail"
          className="h-full !min-h-0 w-full"
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn("min-h-[7rem] w-full rounded-lg border bg-muted/30", className)}>
        <ProductModelThumbnailSkeleton />
      </div>
    )
  }

  if (layers.length > 0) {
    return (
      <div
        className={cn(
          "relative flex min-h-[7rem] w-full items-center justify-center overflow-hidden rounded-lg border bg-muted/30",
          className,
        )}
      >
        <SmartImageComposer
          layers={layers}
          maxSize={280}
          className="h-full w-full object-contain"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex min-h-[7rem] w-full flex-col items-center justify-center gap-1 rounded-lg border bg-muted/30",
        className,
      )}
    >
      <Box className="size-8 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">{t("noPreview")}</span>
    </div>
  )
}
