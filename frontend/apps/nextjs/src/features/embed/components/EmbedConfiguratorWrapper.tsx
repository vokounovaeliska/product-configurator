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
      <div className="flex flex-1 flex-col gap-6 p-6 md:p-10">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid flex-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-[500px] lg:col-span-2" />
          <Skeleton className="h-[500px]" />
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
    />
  )
}
