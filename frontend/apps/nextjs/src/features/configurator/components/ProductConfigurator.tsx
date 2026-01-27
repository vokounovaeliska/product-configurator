"use client"

import { useState } from "react"
import { Typography } from "@workspace/ui/components/typography"

import type { ComponentDto } from "@/api/componentTypes"
import type { ProductModelDto } from "@/api/productModelTypes"
import { Breadcrumbs } from "@/components/SetupNavigation/Breadcrumbs"

import { ComponentSelector } from "./ComponentSelector"
import { PriceDisplay } from "./PriceDisplay"
import { VisualPreview } from "./VisualPreview"

type Props = {
  productModelId: string
  productModel: ProductModelDto
  components: ComponentDto[]
}

export const ProductConfigurator = ({ productModelId, productModel, components }: Props) => {
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)

  // Auto-select first component if none selected
  const activeComponentId = selectedComponentId ?? components[0]?.id ?? null

  return (
    <div className="flex flex-1 flex-col gap-6 bg-muted/30 p-6 md:p-10">
      {/* Breadcrumbs */}
      <Breadcrumbs
        productModelId={productModelId}
        productModelName={productModel.name}
      />

      {/* Header */}
      <div className="space-y-2">
        <Typography
          as="h1"
          variant="display-2xl"
          weight="bold"
        >
          {productModel.name}
        </Typography>
        {productModel.description && (
          <Typography
            as="p"
            variant="body-lg"
            className="text-muted-foreground"
          >
            {productModel.description}
          </Typography>
        )}
      </div>

      {/* Main Content */}
      <div className="grid flex-1 gap-6 lg:grid-cols-3">
        {/* Visual Preview - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <VisualPreview
            productModelId={productModelId}
            selectedComponentId={activeComponentId}
          />
        </div>

        {/* Component Selector & Configuration - Takes 1 column */}
        <div className="space-y-6">
          <PriceDisplay
            basePrice={productModel.price}
            currency={productModel.currency}
          />
          <ComponentSelector
            components={components}
            selectedComponentId={activeComponentId}
            onSelectComponent={setSelectedComponentId}
            productModelId={productModelId}
          />
        </div>
      </div>
    </div>
  )
}
