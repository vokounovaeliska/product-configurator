"use client"

import { useTranslations } from "next-intl"
import { Typography } from "@workspace/ui/components/typography"

import type { ProductModelDto } from "@/api/productModelTypes"

import { ConfiguratorAnalyticsDashboard } from "@/features/analytics/components/ConfiguratorAnalyticsDashboard"

type Props = {
  productModelId: string
  models: ProductModelDto[]
  isLoadingModels: boolean
  modelsError: unknown
}

export const ConfiguratorAnalyticsPublishSection = ({
  productModelId,
  models,
  isLoadingModels,
  modelsError,
}: Props) => {
  const t = useTranslations("Setup.analytics")

  return (
    <section
      className="space-y-6 border-t border-border/60 pt-8"
      aria-labelledby="configurator-analytics-heading"
    >
      <div>
        <Typography
          as="h2"
          id="configurator-analytics-heading"
          variant="display-md"
          weight="semibold"
          className="mb-1"
        >
          {t("title")}
        </Typography>
        <Typography
          as="p"
          variant="body-sm"
          className="text-muted-foreground"
        >
          {t("description")}
        </Typography>
      </div>

      {modelsError != null && (
        <Typography
          as="p"
          variant="body-sm"
          className="text-destructive"
        >
          {modelsError instanceof Error ? modelsError.message : t("modelsLoadError")}
        </Typography>
      )}

      {isLoadingModels && (
        <Typography
          as="p"
          variant="body-sm"
          className="text-muted-foreground"
        >
          {t("loadingModels")}
        </Typography>
      )}

      <ConfiguratorAnalyticsDashboard
        models={models}
        initialProductModelId={productModelId}
      />
    </section>
  )
}
