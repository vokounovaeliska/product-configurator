"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { RotateCcwIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Typography } from "@workspace/ui/components/typography"

import type { AttributeDto, AttributeOptionDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"
import type { AttributePricingRuleDto } from "@/api/pricingTypes"

/* eslint-disable import/no-restricted-paths -- embed composes configurator preview and pricing utils */
import { VisualPreview } from "@/features/configurator/components/VisualPreview"
import { computeModifiersCents } from "@/features/configurator/utils/computePriceFromRules"
/* eslint-enable import/no-restricted-paths */
import type { ProductModelEmbedDto } from "@/features/embed/api/embedQueries"

import { EmbedAttributeConfiguration } from "./EmbedAttributeConfiguration"
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
}

export const EmbedConfigurator = ({
  product,
  components,
  attributesByComponent,
  optionsByAttribute: _optionsByAttribute,
  pricingRules,
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
  const totalPriceCents = basePriceCents + modifiersCents
  const hasModifiers = modifiersCents !== 0

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
          }
        : null,
    [
      product.model3dUrl,
      components,
      attributesByComponent,
      selectedOptionsByComponent,
      selectedOtherValuesByComponent,
    ],
  )

  const configurationForRequest = useMemo(
    () => ({
      selectedOptionsByComponent,
      selectedOtherValuesByComponent,
    }),
    [selectedOptionsByComponent, selectedOtherValuesByComponent],
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

  return (
    <div className="flex flex-1 flex-col gap-6 bg-muted/30 p-6 md:p-10">
      <div className="space-y-2">
        <Typography
          as="h1"
          variant="display-2xl"
          weight="bold"
        >
          {product.name}
        </Typography>
        {product.description && (
          <Typography
            as="p"
            variant="body-lg"
            className="text-muted-foreground"
          >
            {product.description}
          </Typography>
        )}
      </div>

      <div className="grid flex-1 gap-6 lg:min-h-0 lg:grid-cols-3">
        <div className="relative z-0 flex min-h-[40vh] flex-col lg:col-span-2 lg:min-h-[50vh]">
          <VisualPreview
            productModelId={product.id}
            selectedComponentId={activeComponentId}
            selectedOptionLayers={previewLayers}
            model3dUrl={product.model3dUrl}
            model3dConfig={model3dConfig}
            canCapture
            onCaptureReady={product.model3dUrl ? handleCaptureReady : undefined}
          />
        </div>

        <div className="flex flex-col gap-6">
          {/* Sticky price bar on mobile, normal on desktop */}
          <div className="sticky top-4 z-10 flex flex-col gap-4 lg:static">
            <Card className="p-4 shadow-sm">
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-4">
                  <Typography
                    as="span"
                    variant="display-md"
                    weight="semibold"
                  >
                    {formatPrice(totalPriceCents)}
                  </Typography>
                  <Typography
                    as="span"
                    variant="body-sm"
                    className="text-muted-foreground"
                  >
                    {product.currency}
                  </Typography>
                </div>
                {hasModifiers && (
                  <Typography
                    as="p"
                    variant="body-sm"
                    className="text-muted-foreground"
                  >
                    {t("priceBreakdown", {
                      base: formatPrice(basePriceCents),
                      modifier: formatPrice(modifiersCents),
                    })}
                  </Typography>
                )}
              </div>
            </Card>

            {hasSelections && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-fit text-muted-foreground"
                onClick={handleResetConfiguration}
              >
                <RotateCcwIcon className="mr-2 size-4" />
                {t("resetConfiguration")}
              </Button>
            )}
          </div>

          <EmbedAttributeConfiguration
            components={components}
            selectedComponentId={activeComponentId}
            onSelectComponent={handleSelectComponent}
            attributesByComponent={attributesByComponent}
            optionsByAttribute={_optionsByAttribute}
            selectedOptionsByComponent={selectedOptionsByComponent}
            onSelectOption={handleSelectOption}
            selectedOtherValuesByComponent={selectedOtherValuesByComponent}
            onOtherValueChange={handleOtherValueChange}
            pricingRules={pricingRules}
            currency={product.currency}
          />

          <Button
            size="lg"
            className="w-full shadow-md"
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
        totalPriceCents={totalPriceCents}
        configuration={configurationForRequest}
        snapshotSelector="[data-embed-preview]"
        previewLayers={product.model3dUrl ? undefined : previewLayers}
        capture3DRef={product.model3dUrl ? capture3DRef : undefined}
      />
    </div>
  )
}
