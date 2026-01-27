"use client"

import { SetupSidebar } from "@/components/SetupNavigation/SetupSidebar"
import { usePathname } from "@/lib/i18n/navigation"

import { useComponentsList } from "@/features/components/api/componentQueries"

export const SetupSidebarWrapper = () => {
  const pathname = usePathname()

  // Extract productModelId from pathname if we're on a product model or components page
  const pathSegments = pathname.split("/").filter(Boolean)
  const productModelIndex = pathSegments.indexOf("product-models")
  const productModelId =
    productModelIndex !== -1 && pathSegments[productModelIndex + 1]
      ? pathSegments[productModelIndex + 1]
      : null

  // Fetch components if we have a productModelId
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
    />
  )
}
