"use client"

import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"

import { useEmbedProductConfig } from "@/features/embed/api/embedQueries"
import { EmbedConfigurator } from "@/features/embed/components/EmbedConfigurator"

type Props = {
  userId: string
  url: string
}

export const EmbedConfiguratorWrapper = ({ userId, url }: Props) => {
  const { data: config, isLoading, error } = useEmbedProductConfig(userId, url)

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
      <div className="flex w-full flex-col gap-4 p-4 md:p-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_280px]">
          <Skeleton className="aspect-video w-full min-w-0 rounded-lg" />
          <Skeleton className="min-h-48 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  const analyticsContext = config.product.url?.trim()?.length
    ? {
        surface: "EMBED_IFRAME" as const,
        embedOwnerUserId: userId,
        embedProductUrl: config.product.url.trim(),
      }
    : null

  return (
    <EmbedConfigurator
      product={config.product}
      components={config.components}
      attributesByComponent={config.attributesByComponent}
      optionsByAttribute={config.optionsByAttribute}
      pricingRules={config.pricingRules}
      configuratorPreferences={config.configuratorPreferences}
      analyticsContext={analyticsContext}
    />
  )
}
