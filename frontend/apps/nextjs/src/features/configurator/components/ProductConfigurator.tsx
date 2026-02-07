"use client"

import { useCallback, useMemo, useState } from "react"
import { Typography } from "@workspace/ui/components/typography"

import type { AttributeOptionDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"
import { usePricingRulesList } from "@/api/pricingRulesQueries"
import type { ProductModelDto } from "@/api/productModelTypes"
import { Breadcrumbs } from "@/components/SetupNavigation/Breadcrumbs"

import { useConfigurationPrice } from "../hooks/useConfigurationPrice"
import { ComponentSelector } from "./ComponentSelector"
import { PriceDisplay } from "./PriceDisplay"
import { VisualPreview } from "./VisualPreview"

type Props = {
  productModelId: string
  productModel: ProductModelDto
  components: ComponentDto[]
}

/** Selected options per component: componentId -> attributeId -> option (ENUM) */
type SelectedOptionsByComponent = Record<string, Record<string, AttributeOptionDto | null>>
/** Numeric/boolean values per component: componentId -> attributeId -> number | boolean */
type SelectedOtherValuesByComponent = Record<string, Record<string, number | boolean>>

/** Build preview layers stacked by each component's imageZIndex (lower = back, higher = front). */
function buildPreviewLayers(
  components: ComponentDto[],
  selectedOptionsByComponent: SelectedOptionsByComponent,
): { id: string; imageUrl: string; zIndex: number }[] {
  const layers: { id: string; imageUrl: string; zIndex: number }[] = []
  const sortedComponents = [...components].sort((a, b) => a.imageZIndex - b.imageZIndex)
  for (const component of sortedComponents) {
    const byAttribute = selectedOptionsByComponent[component.id] ?? {}
    const options = Object.values(byAttribute).filter(
      (o): o is AttributeOptionDto => o != null && Boolean(o.imageUrl),
    )
    options
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .forEach((o) => {
        layers.push({
          id: o.id,
          imageUrl: o.imageUrl!,
          zIndex: component.imageZIndex * 1000 + o.sortOrder,
        })
      })
  }
  return layers
}

export const ProductConfigurator = ({ productModelId, productModel, components }: Props) => {
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)
  const [selectedOptionsByComponent, setSelectedOptionsByComponent] =
    useState<SelectedOptionsByComponent>({})
  const [selectedOtherValuesByComponent, setSelectedOtherValuesByComponent] =
    useState<SelectedOtherValuesByComponent>({})

  const activeComponentId = selectedComponentId ?? components[0]?.id ?? null

  const { data: pricingRules = [] } = usePricingRulesList(productModelId)
  const { data: pricePreview, isLoading: isPriceLoading } = useConfigurationPrice(
    productModelId,
    components,
    selectedOptionsByComponent,
    selectedOtherValuesByComponent,
  )

  const handleSelectComponent = useCallback((componentId: string) => {
    setSelectedComponentId(componentId)
  }, [])

  const handleSelectOption = useCallback(
    (componentId: string, attributeId: string, option: AttributeOptionDto | null) => {
      setSelectedOptionsByComponent((prev) => ({
        ...prev,
        [componentId]: {
          ...(prev[componentId] ?? {}),
          [attributeId]: option,
        },
      }))
    },
    [],
  )

  const handleOtherValueChange = useCallback(
    (componentId: string, attributeId: string, value: number | boolean) => {
      setSelectedOtherValuesByComponent((prev) => ({
        ...prev,
        [componentId]: {
          ...(prev[componentId] ?? {}),
          [attributeId]: value,
        },
      }))
    },
    [],
  )

  const previewLayers = useMemo(
    () => buildPreviewLayers(components, selectedOptionsByComponent),
    [components, selectedOptionsByComponent],
  )

  return (
    <div className="flex flex-1 flex-col gap-6 bg-muted/30 p-6 md:p-10">
      <Breadcrumbs
        productModelId={productModelId}
        productModelName={productModel.name}
      />

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

      <div className="grid flex-1 gap-6 lg:min-h-0 lg:grid-cols-3">
        <div className="flex min-h-[40vh] flex-col lg:col-span-2 lg:min-h-[50vh]">
          <VisualPreview
            productModelId={productModelId}
            selectedComponentId={activeComponentId}
            selectedOptionLayers={previewLayers}
          />
        </div>

        <div className="space-y-6">
          <PriceDisplay
            basePrice={productModel.price}
            totalPrice={pricePreview?.totalPrice}
            modifiersCents={pricePreview?.modifiersCents ?? 0}
            currency={productModel.currency}
            isLoading={isPriceLoading}
          />
          <ComponentSelector
            components={components}
            selectedComponentId={activeComponentId}
            onSelectComponent={handleSelectComponent}
            productModelId={productModelId}
            selectedOptionsByComponent={selectedOptionsByComponent}
            onSelectOption={handleSelectOption}
            selectedOtherValuesByComponent={selectedOtherValuesByComponent}
            onOtherValueChange={handleOtherValueChange}
            pricingRules={pricingRules}
            currency={productModel.currency}
          />
        </div>
      </div>
    </div>
  )
}
