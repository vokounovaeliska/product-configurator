"use client"

import { useCallback, useMemo, useRef, useState, type MutableRefObject } from "react"
import { RotateCcwIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Typography } from "@workspace/ui/components/typography"

import type { AttributeDto, AttributeOptionDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"
import type { CameraAnglesGetter } from "@/api/configuratorPreferencesTypes"
import type { ConfiguratorPreferencesEmbedDto, ProductModelEmbedDto } from "@/api/embedTypes"
import type { AttributePricingRuleDto } from "@/api/pricingTypes"

/* eslint-disable import/no-restricted-paths -- embed composes configurator preview and pricing utils */
import { ComponentSelector } from "@/features/configurator/components/ComponentSelector"
import { VisualPreview } from "@/features/configurator/components/VisualPreview"
import { computeModifiersCents } from "@/features/configurator/utils/computePriceFromRules"
import { buildFullConfigurationForRequest } from "@/features/embed/utils/buildFullConfiguration"

import { RequestQuoteDialog } from "./RequestQuoteDialog"

type SelectedOptionsByComponent = Record<string, Record<string, AttributeOptionDto | null>>
type SelectedOtherValuesByComponent = Record<string, Record<string, number | boolean>>

function buildPreviewLayers(
  components: ComponentDto[],
  selectedOptionsByComponent: SelectedOptionsByComponent,
  _optionsByAttribute: Record<string, AttributeOptionDto[]>,
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

type Props = {
  product: ProductModelEmbedDto
  components: ComponentDto[]
  attributesByComponent: Record<string, AttributeDto[]>
  optionsByAttribute: Record<string, AttributeOptionDto[]>
  pricingRules: AttributePricingRuleDto[]
  configuratorPreferences?: ConfiguratorPreferencesEmbedDto | null
  /**
   * Live camera distance for embed (e.g. publish tab slider). Syncs 3D without saving.
   * When set, overrides saved embed zoom until cleared.
   */
  publishLiveCameraDistance?: number | null
  /**
   * When set (e.g. publish tab live preview), overrides saved preferences for title/description/components visibility.
   */
  embedUiOverrides?: {
    showProductName: boolean
    showDescription: boolean
    showComponents: boolean
  }
  cameraAnglesGetterRef?: MutableRefObject<CameraAnglesGetter | null>
  onEmbedCameraDistanceChange?: (distance: number) => void
}

export const EmbedConfigurator = ({
  product,
  components,
  attributesByComponent,
  optionsByAttribute: _optionsByAttribute,
  pricingRules,
  configuratorPreferences,
  publishLiveCameraDistance,
  embedUiOverrides,
  cameraAnglesGetterRef,
  onEmbedCameraDistanceChange,
}: Props) => {
  const t = useTranslations("Embed")
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null)
  const [selectedOptionsByComponent, setSelectedOptionsByComponent] =
    useState<SelectedOptionsByComponent>({})
  const [selectedOtherValuesByComponent, setSelectedOtherValuesByComponent] =
    useState<SelectedOtherValuesByComponent>({})
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false)
  const capture3DRef = useRef<(() => Promise<string | null>) | null>(null)

  const activeComponentId = selectedComponentId ?? components[0]?.id ?? null

  const handleCaptureReady = useCallback((capture: () => Promise<string | null>) => {
    capture3DRef.current = capture
  }, [])

  const modifiersCents = useMemo(
    () =>
      computeModifiersCents(
        pricingRules,
        components,
        attributesByComponent,
        selectedOptionsByComponent,
        selectedOtherValuesByComponent,
      ),
    [
      pricingRules,
      components,
      attributesByComponent,
      selectedOptionsByComponent,
      selectedOtherValuesByComponent,
    ],
  )
  const basePriceCents = Math.round(product.price * 100)
  const totalPrice = basePriceCents + modifiersCents

  const handleResetConfiguration = useCallback(() => {
    setSelectedOptionsByComponent({})
    setSelectedOtherValuesByComponent({})
  }, [])

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
    () => buildPreviewLayers(components, selectedOptionsByComponent, _optionsByAttribute),
    [components, selectedOptionsByComponent, _optionsByAttribute],
  )

  const model3dConfig = useMemo(
    () =>
      product.model3dUrl
        ? {
            components,
            attributesByComponent,
            selectedOptionsByComponent,
            selectedOtherValuesByComponent,
            optionsByAttribute: _optionsByAttribute,
          }
        : null,
    [
      product.model3dUrl,
      components,
      attributesByComponent,
      selectedOptionsByComponent,
      selectedOtherValuesByComponent,
      _optionsByAttribute,
    ],
  )

  const configurationForRequest = useMemo(
    () =>
      buildFullConfigurationForRequest(
        components,
        attributesByComponent,
        _optionsByAttribute,
        selectedOptionsByComponent,
        selectedOtherValuesByComponent,
      ),
    [
      components,
      attributesByComponent,
      _optionsByAttribute,
      selectedOptionsByComponent,
      selectedOtherValuesByComponent,
    ],
  )

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: product.currency,
      minimumFractionDigits: 2,
    }).format(cents / 100)

  const hasSelections =
    Object.keys(selectedOptionsByComponent).length > 0 ||
    Object.keys(selectedOtherValuesByComponent).length > 0

  const isProductNameShownInEmbed = embedUiOverrides
    ? embedUiOverrides.showProductName
    : (configuratorPreferences?.embedShowProductName ?? false)
  const isDescriptionShownInEmbed = embedUiOverrides
    ? embedUiOverrides.showDescription
    : (configuratorPreferences?.embedShowDescription ?? false)
  const isComponentsShownInEmbed = embedUiOverrides
    ? embedUiOverrides.showComponents
    : (configuratorPreferences?.embedShowComponents ?? false)

  return (
    <div
      className="flex w-full flex-col gap-3 bg-muted/30 p-3 sm:gap-4 sm:p-4 md:p-6"
      style={{
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      {(isProductNameShownInEmbed || isDescriptionShownInEmbed) && (
        <div className="shrink-0 space-y-0.5 border-b border-border/40 pb-2 sm:space-y-1 sm:pb-2.5">
          {isProductNameShownInEmbed && (
            <Typography
              as="h1"
              variant="body-md"
              weight="semibold"
              className="leading-snug text-foreground"
            >
              {product.name}
            </Typography>
          )}
          {isDescriptionShownInEmbed && product.description && (
            <Typography
              as="p"
              variant="body-sm"
              className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm"
            >
              {product.description}
            </Typography>
          )}
        </div>
      )}

      <div className="flex w-full flex-col gap-4 lg:grid lg:grid-cols-3 lg:items-start lg:gap-4">
        <div className="relative z-0 order-2 flex w-full flex-col items-center justify-center lg:order-none lg:col-span-2">
          <VisualPreview
            productModelId={product.id}
            selectedComponentId={activeComponentId}
            selectedOptionLayers={previewLayers}
            model3dUrl={product.model3dUrl}
            model3dConfig={model3dConfig}
            model3dEffects={product.model3dEffects}
            configuratorPreferencesFromServer={configuratorPreferences}
            cameraDistanceOverride={publishLiveCameraDistance ?? undefined}
            canCapture
            onCaptureReady={product.model3dUrl ? handleCaptureReady : undefined}
            embedPreview
            cameraAnglesGetterRef={cameraAnglesGetterRef}
            onCameraDistanceChange={onEmbedCameraDistanceChange}
          />
        </div>

        <div className="order-1 flex w-full flex-col gap-3 lg:order-none">
          <div className="flex shrink-0 flex-col gap-2">
            <Card className="p-3 shadow-sm">
              <div className="flex items-baseline justify-between gap-2">
                <Typography
                  as="span"
                  variant="display-sm"
                  weight="semibold"
                >
                  {formatPrice(totalPrice)}
                </Typography>
                <Typography
                  as="span"
                  variant="body-sm"
                  className="text-muted-foreground"
                >
                  {product.currency}
                </Typography>
              </div>
            </Card>

            {hasSelections && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-[44px] w-fit px-3 py-2.5 text-muted-foreground sm:h-8 sm:min-h-0 sm:px-2 sm:py-0"
                onClick={handleResetConfiguration}
              >
                <RotateCcwIcon className="mr-1.5 size-3.5" />
                <span className="text-sm">{t("resetConfiguration")}</span>
              </Button>
            )}
          </div>

          <div className="w-full">
            <ComponentSelector
              components={components}
              selectedComponentId={activeComponentId}
              onSelectComponent={handleSelectComponent}
              productModelId={product.id}
              selectedOptionsByComponent={selectedOptionsByComponent}
              onSelectOption={handleSelectOption}
              selectedOtherValuesByComponent={selectedOtherValuesByComponent}
              onOtherValueChange={handleOtherValueChange}
              pricingRules={pricingRules}
              currency={product.currency}
              attributesByComponent={attributesByComponent}
              optionsByAttribute={_optionsByAttribute}
              shouldShowComponents={isComponentsShownInEmbed}
              shouldShowAttributeSectionHeading={isComponentsShownInEmbed}
              productModelName={isProductNameShownInEmbed ? null : product.name}
              shouldOmitSectionHeading={isProductNameShownInEmbed}
            />
          </div>

          <Button
            size="default"
            className="shrink-0 py-3 shadow-md sm:py-2"
            onClick={() => setIsRequestDialogOpen(true)}
          >
            {t("requestQuote")}
          </Button>
        </div>
      </div>

      <RequestQuoteDialog
        isOpen={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        product={product}
        totalPrice={totalPrice}
        configuration={configurationForRequest}
        snapshotSelector="[data-embed-preview]"
        previewLayers={product.model3dUrl ? undefined : previewLayers}
        capture3DRef={product.model3dUrl ? capture3DRef : undefined}
      />
    </div>
  )
}
