"use client"

import { useTranslations } from "next-intl"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"

import type { ProductModelDto } from "@/api/productModelTypes"

/* eslint-disable import/no-restricted-paths -- publish tab composes public embed UI in-page for live zoom */
import { useEmbedProductConfigById } from "@/features/embed/api/embedQueries"
import { EmbedConfigurator } from "@/features/embed/components/EmbedConfigurator"

/* eslint-enable import/no-restricted-paths */

type Props = {
  productModel: ProductModelDto
  /** Clamped live camera distance; updates the 3D view as the user drags the slider. */
  liveCameraDistance: number
}

/**
 * Same embed UI as the public iframe, loaded in-page so zoom reacts live to the publish-tab slider.
 */
export function PublishEmbedLivePreview({ productModel, liveCameraDistance }: Props) {
  const t = useTranslations("ProductModels.Publish")
  const {
    data: config,
    isLoading,
    error,
  } = useEmbedProductConfigById(productModel.id, {
    enabled: Boolean(productModel.isPublished && productModel.url?.trim()),
  })

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <Typography
          as="p"
          variant="body-sm"
          className="text-destructive"
        >
          {error instanceof Error ? error.message : t("embedPreviewLoadError")}
        </Typography>
      </div>
    )
  }

  if (isLoading || !config) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-[50vh] min-h-[320px] w-full rounded-lg" />
      </div>
    )
  }

  return (
    <div className="flex max-h-[min(75vh,900px)] min-h-[400px] flex-col overflow-hidden rounded-lg border bg-muted/30">
      <div className="min-h-0 flex-1 overflow-auto">
        <EmbedConfigurator
          product={config.product}
          components={config.components}
          attributesByComponent={config.attributesByComponent}
          optionsByAttribute={config.optionsByAttribute}
          pricingRules={config.pricingRules}
          configuratorPreferences={config.configuratorPreferences}
          publishLiveCameraDistance={liveCameraDistance}
        />
      </div>
    </div>
  )
}
