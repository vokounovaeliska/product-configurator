"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { PencilIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Typography } from "@workspace/ui/components/typography"

import type { AttributeOptionDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"
import {
  buildClientEventPayload,
  sendConfiguratorAnalyticsEvents,
} from "@/api/configuratorAnalyticsClient"
import type { ConfiguratorAnalyticsPublicContext } from "@/api/configuratorAnalyticsTypes"
import type { CameraAnglesGetter } from "@/api/configuratorPreferencesTypes"
import type { ProductEmbedFullDto, ProductModelEmbedDto } from "@/api/embedTypes"
import { usePricingRulesList } from "@/api/pricingRulesQueries"
import type { ProductModelDto } from "@/api/productModelTypes"
import { useCurrentUser } from "@/api/userQueries"
import { Breadcrumbs } from "@/components/SetupNavigation/Breadcrumbs"
 
import { getOrCreateConfiguratorAnalyticsSessionId } from "@/lib/configuratorAnalyticsSession"
import { Link } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

import { useComputedPrice } from "@/features/configurator/hooks/useComputedPrice"
import { useConfiguratorAttributes } from "@/features/configurator/hooks/useConfiguratorAttributes"
import { useOptionsByAttributeFor3D } from "@/features/configurator/hooks/useOptionsByAttributeFor3D"
/* eslint-disable import/no-restricted-paths -- public page shares embed quote + configuration payload helpers */
import { RequestQuoteDialog } from "@/features/embed/components/RequestQuoteDialog"
import { buildFullConfigurationForRequest } from "@/features/embed/utils/buildFullConfiguration"

import { ComponentSelector } from "./ComponentSelector"
import { ConfiguratorPreviewSettings } from "./ConfiguratorPreviewSettings"
import { PriceDisplay } from "./PriceDisplay"
import { VisualPreview } from "./VisualPreview"

type Props = {
  productModelId: string
  productModel: ProductModelDto
  components: ComponentDto[]
  prefetchedConfig?: ProductEmbedFullDto | null
  /** Anonymous public configurator page: analytics + quote dialog (not for logged-in editors). */
  isVisitorAnalyticsEnabled?: boolean
}

type SelectedOptionsByComponent = Record<string, Record<string, AttributeOptionDto | null>>

type SelectedOtherValuesByComponent = Record<string, Record<string, number | boolean>>

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
  isVisitorAnalyticsEnabled = false,
}: Props) => {
  const t = useTranslations("Configurator")
  const { data: currentUser } = useCurrentUser()
  const isOwner = Boolean(currentUser?.id && currentUser.id === productModel.userId)

  const analyticsContext: ConfiguratorAnalyticsPublicContext | null = useMemo(
    () => (isVisitorAnalyticsEnabled ? { surface: "PUBLIC_CONFIGURATOR_PAGE" } : null),
    [isVisitorAnalyticsEnabled],
  )

  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const capture3DRef = useRef<(() => Promise<string | null>) | null>(null)

  useEffect(() => {
    if (!analyticsContext) return
    const sid = getOrCreateConfiguratorAnalyticsSessionId()
    if (!sid) return
    void sendConfiguratorAnalyticsEvents([
      buildClientEventPayload(productModelId, "CONFIGURATOR_OPEN", sid, analyticsContext),
    ])
  }, [analyticsContext, productModelId])

  useEffect(() => {
    if (!analyticsContext || !isRequestDialogOpen) return
    const sid = getOrCreateConfiguratorAnalyticsSessionId()
    if (!sid) return
    void sendConfiguratorAnalyticsEvents([
      buildClientEventPayload(productModelId, "REQUEST_FORM_OPEN", sid, analyticsContext),
    ])
  }, [analyticsContext, isRequestDialogOpen, productModelId])

  const handleCaptureReady = useCallback((capture: () => Promise<string | null>) => {
    capture3DRef.current = capture
  }, [])

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

  const cameraAnglesGetterRef = useRef<CameraAnglesGetter | null>(null)

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
      setSelectedOptionsByComponent((prev) => {
        const prior = prev[componentId]?.[attributeId] ?? null
        const hasConfigurationChanged =
          (prior == null && option != null) ||
          (prior != null && option == null) ||
          (prior != null && option != null && prior.id !== option.id)

        if (hasConfigurationChanged && analyticsContext) {
          const sid = getOrCreateConfiguratorAnalyticsSessionId()
          if (sid) {
            void sendConfiguratorAnalyticsEvents([
              buildClientEventPayload(
                productModelId,
                "CONFIGURATION_CHANGE",
                sid,
                analyticsContext,
              ),
            ])
          }
        }

        return {
          ...prev,
          [componentId]: {
            ...(prev[componentId] ?? {}),
            [attributeId]: option,
          },
        }
      })
    },
    [analyticsContext, productModelId],
  )

  const handleOtherValueChange = useCallback(
    (componentId: string, attributeId: string, value: number | boolean) => {
      setSelectedOtherValuesByComponent((prev) => {
        const prior = prev[componentId]?.[attributeId]
        const hasConfigurationChanged = prior !== value

        if (hasConfigurationChanged && analyticsContext) {
          const sid = getOrCreateConfiguratorAnalyticsSessionId()
          if (sid) {
            void sendConfiguratorAnalyticsEvents([
              buildClientEventPayload(
                productModelId,
                "CONFIGURATION_CHANGE",
                sid,
                analyticsContext,
              ),
            ])
          }
        }

        return {
          ...prev,
          [componentId]: {
            ...(prev[componentId] ?? {}),
            [attributeId]: value,
          },
        }
      })
    },
    [analyticsContext, productModelId],
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

  const configurationForRequest = useMemo(
    () =>
      buildFullConfigurationForRequest(
        components,
        attributesByComponent,
        optionsByAttribute,
        selectedOptionsByComponent,
        selectedOtherValuesByComponent,
      ),
    [
      components,
      attributesByComponent,
      optionsByAttribute,
      selectedOptionsByComponent,
      selectedOtherValuesByComponent,
    ],
  )

  const productEmbedForQuote: ProductModelEmbedDto = useMemo(
    () => ({
      id: productModel.id,
      name: productModel.name,
      description: productModel.description,
      price: productModel.price,
      currency: productModel.currency,
      model3dUrl: productModel.model3dUrl ?? null,
      model3dEffects: productModel.model3dEffects ?? null,
      url: productModel.url ?? null,
    }),
    [productModel],
  )

  const quoteTotalPriceCents = Math.round((computedPrice?.totalPrice ?? productModel.price) * 100)

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
            cameraAnglesGetterRef={cameraAnglesGetterRef}
            canCapture={Boolean(isVisitorAnalyticsEnabled && productModel.model3dUrl)}
            onCaptureReady={
              isVisitorAnalyticsEnabled && productModel.model3dUrl ? handleCaptureReady : undefined
            }
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
              cameraAnglesGetterRef={cameraAnglesGetterRef}
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
          {isVisitorAnalyticsEnabled && (
            <Button
              size="default"
              className="w-full"
              onClick={() => setIsRequestDialogOpen(true)}
            >
              {t("requestQuote")}
            </Button>
          )}
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
            shouldOmitSectionHeading
          />
        </div>
      </div>

      {isVisitorAnalyticsEnabled && (
        <RequestQuoteDialog
          isOpen={isRequestDialogOpen}
          onOpenChange={setIsRequestDialogOpen}
          product={productEmbedForQuote}
          totalPrice={quoteTotalPriceCents}
          configuration={configurationForRequest}
          snapshotSelector="[data-embed-preview]"
          previewLayers={productModel.model3dUrl ? undefined : previewLayers}
          capture3DRef={productModel.model3dUrl ? capture3DRef : undefined}
          getAnalyticsSubmissionFields={
            analyticsContext
              ? () => {
                  const sid = getOrCreateConfiguratorAnalyticsSessionId()
                  if (!sid) return null
                  return {
                    analyticsSessionId: sid,
                    analyticsSurface: analyticsContext.surface,
                  }
                }
              : undefined
          }
        />
      )}
    </div>
  )
}
