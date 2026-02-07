"use client"

import { useQuery } from "@tanstack/react-query"

import { SetupSidebar } from "@/components/SetupNavigation/SetupSidebar"
import { usePathname } from "@/lib/i18n/navigation"

import { useComponentsList } from "@/features/components/api/componentQueries"
import { getProductModelQueryOptions } from "@/features/productModels/api/productModelQueries"

export const SetupSidebarWrapper = () => {
  const pathname = usePathname()

  const pathSegments = pathname.split("/").filter(Boolean)
  const productModelIndexFromSetup = pathSegments.indexOf("product-models")
  const productModelIndexFromConfigurator = pathSegments.indexOf("configurator")
  const productModelId =
    productModelIndexFromSetup !== -1 && pathSegments[productModelIndexFromSetup + 1]
      ? pathSegments[productModelIndexFromSetup + 1]
      : productModelIndexFromConfigurator !== -1 &&
          pathSegments[productModelIndexFromConfigurator + 1]
        ? pathSegments[productModelIndexFromConfigurator + 1]
        : null

  const { data: productModel } = useQuery({
    ...getProductModelQueryOptions(productModelId ?? ""),
    enabled: Boolean(productModelId),
  })
  const { data: componentsData, isLoading: isLoadingComponents } = useComponentsList(
    productModelId ?? "",
    { limit: 100 },
    { enabled: Boolean(productModelId) },
  )

  const components = componentsData?.items ?? []

  return (
    <SetupSidebar
      components={components}
      isLoadingComponents={isLoadingComponents}
      productModelName={productModel?.name}
    />
  )
}
