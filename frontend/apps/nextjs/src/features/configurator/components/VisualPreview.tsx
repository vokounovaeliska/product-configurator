"use client"

import { useTranslations } from "next-intl"
import { Card } from "@workspace/ui/components/card"
import { Typography } from "@workspace/ui/components/typography"

type Props = {
  productModelId: string
  selectedComponentId: string | null
}

/**
 * Visual preview component that displays layered images based on configuration
 * This will be enhanced when image layers API is available
 */
export const VisualPreview = ({
  productModelId: _productModelId,
  selectedComponentId: _selectedComponentId,
}: Props) => {
  const t = useTranslations("Configurator")

  // TODO: Fetch image layers based on current configuration
  // TODO: Filter layers by conditions (attribute values)
  // TODO: Sort layers by z-index
  // TODO: Render layers as stacked images

  return (
    <Card className="flex h-full min-h-[500px] items-center justify-center p-10">
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-lg bg-muted">
          {/* Placeholder for image layers */}
          <Typography
            as="p"
            variant="body-md"
            className="text-muted-foreground"
          >
            {t("preview.placeholder")}
          </Typography>
        </div>
        <Typography
          as="p"
          variant="body-sm"
          className="text-muted-foreground"
        >
          {t("preview.comingSoon")}
        </Typography>
      </div>
    </Card>
  )
}
