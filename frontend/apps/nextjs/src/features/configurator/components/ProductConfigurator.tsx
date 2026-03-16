"use client"

import { useCallback, useMemo, useState } from "react"
import { PencilIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Typography } from "@workspace/ui/components/typography"

import type { AttributeOptionDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"
import type { ProductEmbedFullDto } from "@/api/embedTypes"
import { usePricingRulesList } from "@/api/pricingRulesQueries"
import type { ProductModelDto } from "@/api/productModelTypes"
import { useCurrentUser } from "@/api/userQueries"
import { Breadcrumbs } from "@/components/SetupNavigation/Breadcrumbs"
import { Link } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

import { useComputedPrice } from "@/features/configurator/hooks/useComputedPrice"
import { useConfiguratorAttributes } from "@/features/configurator/hooks/useConfiguratorAttributes"
import { useOptionsByAttributeFor3D } from "@/features/configurator/hooks/useOptionsByAttributeFor3D"

import { ComponentSelector } from "./ComponentSelector"
import { ConfiguratorPreviewSettings } from "./ConfiguratorPreviewSettings"
import { PriceDisplay } from "./PriceDisplay"
import { VisualPreview } from "./VisualPreview"

type Props = {
  productModelId: string
  productModel: ProductModelDto
  components: ComponentDto[]
  prefetchedConfig?: ProductEmbedFullDto | null
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

export const ProductConfigurator = ({
  productModelId,
  productModel,
  components,
  prefetchedConfig,
}: Props) => {
  const t = useTranslations("Configurator")
  const { data: currentUser } = useCurrentUser()
  const isOwner = Boolean(currentUser?.id && currentUser.id === productModel.userId)

  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)
  const [selectedOptionsByComponent, setSelectedOptionsByComponent] =
    useState<SelectedOptionsByComponent>({})
  const [selectedOtherValuesByComponent, setSelectedOtherValuesByComponent] =
    useState<SelectedOtherValuesByComponent>({})

  const [liveZoomFromViewer, setLiveZoomFromViewer] = useState<number | null>(null)
  const [sliderOverride, setSliderOverride] = useState<number | null>(null)
  const [backgroundOverride, setBackgroundOverride] = useState<string | null>(null)
  const onCameraDistanceChange = useCallback((distance: number) => {
    setLiveZoomFromViewer(distance)
  }, [])
  const onSliderChange = useCallback((value: number) => {
    setSliderOverride(value)
  }, [])
  const onBackgroundChange = useCallback((value: string) => {
    setBackgroundOverride(value)
  }, [])
  const onSaveSuccess = useCallback(() => {
    setSliderOverride(null)
    setBackgroundOverride(null)
  }, [])

  const activeComponentId = selectedComponentId ?? components[0]?.id ?? null

  const { data: pricingRulesFromApi = [] } = usePricingRulesList(
    { productModelId },
    { enabled: prefetchedConfig == null },
  )
  const { attributesByComponent: attributesFromApi } = useConfiguratorAttributes(
    productModelId,
    components,
    { enabled: prefetchedConfig == null },
  )
  const optionsByAttributeFromApi = useOptionsByAttributeFor3D(
    productModelId,
    components,
    attributesFromApi,
    Boolean(productModel.model3dUrl) && prefetchedConfig == null,
  )

  const pricingRules = prefetchedConfig?.pricingRules ?? pricingRulesFromApi
  const attributesByComponent = prefetchedConfig?.attributesByComponent ?? attributesFromApi
  const optionsByAttribute = prefetchedConfig?.optionsByAttribute ?? optionsByAttributeFromApi
  const { data: computedPrice, isLoading: isPriceLoading } = useComputedPrice(
    productModelId,
    productModel.price,
    components,
    selectedOptionsByComponent,
    selectedOtherValuesByComponent,
    pricingRules,
  )
  const shouldShowPriceSkeleton = isPriceLoading && computedPrice == null

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

  const model3dConfig = useMemo(
    () =>
      productModel.model3dUrl
        ? {
            components,
            attributesByComponent,
            selectedOptionsByComponent,
            selectedOtherValuesByComponent,
            optionsByAttribute,
          }
        : null,
    [
      productModel.model3dUrl,
      components,
      attributesByComponent,
      selectedOptionsByComponent,
      selectedOtherValuesByComponent,
      optionsByAttribute,
    ],
  )

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-x-hidden bg-muted/30 p-4 sm:gap-6 sm:p-6 md:p-10">
      <Breadcrumbs
        productModelId={productModelId}
        productModelName={productModel.name}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
        {isOwner && (
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <Link href={ROUTES.setupComponents(productModelId)}>
              <PencilIcon className="mr-2 size-4" />
              {t("editButton")}
            </Link>
          </Button>
        )}
      </div>

      <div className="grid min-w-0 flex-1 gap-4 sm:gap-6 lg:min-h-0 lg:grid-cols-3">
        <div className="flex max-h-[50vh] min-h-[280px] flex-col sm:max-h-[60vh] sm:min-h-[40vh] lg:col-span-2 lg:max-h-[60vh] lg:min-h-[50vh]">
          <VisualPreview
            productModelId={productModelId}
            selectedComponentId={activeComponentId}
            selectedOptionLayers={previewLayers}
            model3dUrl={productModel.model3dUrl}
            model3dConfig={model3dConfig}
            model3dEffects={productModel.model3dEffects}
            configuratorPreferencesFromServer={prefetchedConfig?.configuratorPreferences}
            cameraDistanceOverride={sliderOverride}
            backgroundPresetOverride={backgroundOverride}
            onCameraDistanceChange={onCameraDistanceChange}
          />
        </div>

        <div className="min-w-0 space-y-4 sm:space-y-6">
          {productModel.model3dUrl && isOwner && (
            <ConfiguratorPreviewSettings
              productModelId={productModelId}
              liveZoomFromViewer={liveZoomFromViewer}
              onSliderChange={onSliderChange}
              onBackgroundChange={onBackgroundChange}
              onSaveSuccess={onSaveSuccess}
            />
          )}
          <PriceDisplay
            basePrice={productModel.price}
            totalPrice={computedPrice?.totalPrice}
            modifiersCents={computedPrice?.modifiersCents ?? 0}
            currency={productModel.currency}
            isLoading={shouldShowPriceSkeleton}
            isCompact
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
            attributesByComponent={attributesByComponent}
            optionsByAttribute={optionsByAttribute}
          />
        </div>
      </div>
    </div>
  )
}
