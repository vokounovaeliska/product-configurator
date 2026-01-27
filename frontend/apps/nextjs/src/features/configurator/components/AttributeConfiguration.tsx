"use client"

import { useTranslations } from "next-intl"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"

type Props = {
  componentId: string
  productModelId: string
}

/**
 * Placeholder for attribute configuration
 * This will be implemented when attributes API is available
 */
export const AttributeConfiguration = ({
  componentId: _componentId,
  productModelId: _productModelId,
}: Props) => {
  const t = useTranslations("Configurator")

  // TODO: Fetch attributes for this component
  // TODO: Render attribute inputs based on type (ENUM, INTEGER, DECIMAL, BOOLEAN)
  // TODO: Handle attribute value changes and update configuration state

  return (
    <div className="space-y-4">
      <Typography
        as="h4"
        variant="body-lg"
        weight="semibold"
      >
        {t("attributes.title")}
      </Typography>
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <Typography
        as="p"
        variant="body-sm"
        className="text-muted-foreground"
      >
        {t("attributes.comingSoon")}
      </Typography>
    </div>
  )
}
