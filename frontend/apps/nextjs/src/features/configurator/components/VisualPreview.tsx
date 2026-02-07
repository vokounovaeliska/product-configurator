"use client"

import { useTranslations } from "next-intl"
import { Card } from "@workspace/ui/components/card"
import { Typography } from "@workspace/ui/components/typography"

import { SmartImageComposer } from "@/components/SmartImageComposer"

export type PreviewLayer = {
  id: string
  imageUrl: string
  zIndex: number
}

type Props = {
  productModelId: string
  selectedComponentId: string | null
  /** Layers from selected attribute options (configurator) */
  selectedOptionLayers?: PreviewLayer[]
}

export const VisualPreview = ({
  productModelId: _productModelId,
  selectedComponentId,
  selectedOptionLayers = [],
}: Props) => {
  const t = useTranslations("Configurator")

  const layerItems = selectedOptionLayers

  if (!selectedComponentId && layerItems.length === 0) {
    return (
      <Card className="flex h-full min-h-[40vh] flex-1 items-center justify-center p-10">
        <Typography
          as="p"
          variant="body-md"
          className="text-muted-foreground"
        >
          {t("preview.selectComponent")}
        </Typography>
      </Card>
    )
  }

  if (layerItems.length === 0) {
    return (
      <Card className="flex h-full min-h-[40vh] flex-1 items-center justify-center p-10">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-lg bg-muted">
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
            {t("preview.selectOptions")}
          </Typography>
        </div>
      </Card>
    )
  }

  return (
    <Card className="flex h-full min-h-0 flex-1 flex-col overflow-hidden p-4 md:p-6">
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <SmartImageComposer
          layers={layerItems}
          maxSize={560}
          className="rounded-lg border bg-muted/30"
        />
      </div>
    </Card>
  )
}
