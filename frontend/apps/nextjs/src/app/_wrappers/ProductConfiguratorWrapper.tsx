"use client"

import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"

import { useCurrentUser } from "@/api/userQueries"

import { useComponentsList } from "@/features/components/api/componentQueries"
import { ProductConfigurator } from "@/features/configurator/components/ProductConfigurator"
import { useEmbedProductConfigById } from "@/features/embed/api/embedQueries"
import { useProductModel } from "@/features/productModels/api/productModelQueries"

type Props = {
  productModelId: string
}

export const ProductConfiguratorWrapper = ({ productModelId }: Props) => {
  const { data: currentUser } = useCurrentUser()
  const isLoggedIn = Boolean(currentUser?.id)

  const shouldUseEmbedApi = !isLoggedIn

  const {
    data: embedConfig,
    isLoading: isLoadingEmbed,
    error: embedError,
  } = useEmbedProductConfigById(productModelId, {
    enabled: shouldUseEmbedApi,
  })
  const {
    data: productModel,
    isLoading: isLoadingProductModel,
    error: productModelError,
  } = useProductModel(productModelId, { enabled: isLoggedIn })
  const { data: componentsData, isLoading: isLoadingComponents } = useComponentsList(
    productModelId,
    { limit: 100 },
    { enabled: isLoggedIn },
  )

  const components = componentsData?.items ?? embedConfig?.components ?? []
  const isLoading = shouldUseEmbedApi
    ? isLoadingEmbed
    : isLoadingProductModel || isLoadingComponents

  if (shouldUseEmbedApi && embedError) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 sm:p-10">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <Typography
            as="p"
            variant="body-md"
            className="text-destructive"
          >
            {embedError instanceof Error ? embedError.message : "Product not found"}
          </Typography>
        </div>
      </div>
    )
  }

  if (isLoggedIn && productModelError) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 sm:p-10">
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

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6 md:p-10">
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

  if (shouldUseEmbedApi && embedConfig) {
    const productModelFromEmbed = {
      id: embedConfig.product.id,
      userId: productModel?.userId ?? "",
      name: embedConfig.product.name,
      description: embedConfig.product.description,
      price: embedConfig.product.price,
      currency: embedConfig.product.currency,
      isActive: true,
      model3dUrl: embedConfig.product.model3dUrl,
      model3dEffects: embedConfig.product.model3dEffects,
      url: embedConfig.product.url,
      isPublished: true,
      createdAt: "",
      modifiedAt: "",
    }
    return (
      <ProductConfigurator
        productModelId={productModelId}
        productModel={productModelFromEmbed}
        components={components}
        prefetchedConfig={embedConfig}
      />
    )
  }

  if (productModel) {
    return (
      <ProductConfigurator
        productModelId={productModelId}
        productModel={productModel}
        components={components}
      />
    )
  }

  if (isLoggedIn && !productModel) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 sm:p-10">
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

  return null
}
