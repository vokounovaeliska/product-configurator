"use client"

import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"

import { useEmbedProductConfig } from "@/features/embed/api/embedQueries"
import { EmbedConfigurator } from "@/features/embed/components/EmbedConfigurator"

type Props = {
  url: string
}

export const EmbedConfiguratorWrapper = ({ url }: Props) => {
  const { data: config, isLoading, error } = useEmbedProductConfig(url)

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-10">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <Typography
            as="p"
            variant="body-md"
            className="text-destructive"
          >
            {error instanceof Error ? error.message : "Product not found"}
          </Typography>
        </div>
      </div>
    )
  }

  if (isLoading || !config) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 md:p-6">
        <div className="shrink-0 space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_280px]">
          <Skeleton className="min-h-[35vh] min-w-0 lg:min-h-0" />
          <Skeleton className="min-h-0" />
        </div>
      </div>
    )
  }

  return (
    <EmbedConfigurator
      product={config.product}
      components={config.components}
      attributesByComponent={config.attributesByComponent}
      optionsByAttribute={config.optionsByAttribute}
      pricingRules={config.pricingRules}
      configuratorPreferences={config.configuratorPreferences}
    />
  )
}
