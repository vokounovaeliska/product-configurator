"use client"

import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"

import { useComponentsList } from "@/features/components/api/componentQueries"
import { ProductConfigurator } from "@/features/configurator/components/ProductConfigurator"
import { useProductModel } from "@/features/productModels/api/productModelQueries"

type Props = {
  productModelId: string
}

export const ProductConfiguratorWrapper = ({ productModelId }: Props) => {
  const {
    data: productModel,
    isLoading: isLoadingProductModel,
    error: productModelError,
  } = useProductModel(productModelId)
  const { data: componentsData, isLoading: isLoadingComponents } = useComponentsList(
    productModelId,
    { limit: 100 },
  )

  const components = componentsData?.items ?? []

  if (productModelError) {
    return (
      <div className="flex flex-1 items-center justify-center p-10">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <Typography
            as="p"
            variant="body-md"
            className="text-destructive"
          >
            Error loading product model
          </Typography>
        </div>
      </div>
    )
  }

  if (isLoadingProductModel || isLoadingComponents) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6 md:p-10">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid flex-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-[600px] lg:col-span-2" />
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    )
  }

  if (!productModel) {
    return (
      <div className="flex flex-1 items-center justify-center p-10">
        <Typography
          as="p"
          variant="body-lg"
          className="text-muted-foreground"
        >
          Product model not found
        </Typography>
      </div>
    )
  }

  // TypeScript knows productModel is not null here due to the check above
  return (
    <ProductConfigurator
      productModelId={productModelId}
      productModel={productModel}
      components={components}
    />
  )
}
