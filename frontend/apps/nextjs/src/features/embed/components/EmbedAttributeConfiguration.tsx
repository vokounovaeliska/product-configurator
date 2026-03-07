"use client"

import { CheckIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Card } from "@workspace/ui/components/card"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import type { AttributeDto, AttributeOptionDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"
import type { AttributePricingRuleDto } from "@/api/pricingTypes"

import { EmbedAttributeField } from "./EmbedAttributeField"

type SelectedOptionsByComponent = Record<string, Record<string, AttributeOptionDto | null>>
type SelectedOtherValuesByComponent = Record<string, Record<string, number | boolean>>

type Props = {
  components: ComponentDto[]
  selectedComponentId: string | null
  onSelectComponent: (componentId: string) => void
  attributesByComponent: Record<string, AttributeDto[]>
  optionsByAttribute: Record<string, AttributeOptionDto[]>
  selectedOptionsByComponent: SelectedOptionsByComponent
  onSelectOption: (
    componentId: string,
    attributeId: string,
    option: AttributeOptionDto | null,
  ) => void
  selectedOtherValuesByComponent: SelectedOtherValuesByComponent
  onOtherValueChange: (componentId: string, attributeId: string, value: number | boolean) => void
  pricingRules: AttributePricingRuleDto[]
  currency: string
}

export const EmbedAttributeConfiguration = ({
  components,
  selectedComponentId,
  onSelectComponent,
  attributesByComponent,
  optionsByAttribute,
  selectedOptionsByComponent,
  onSelectOption,
  selectedOtherValuesByComponent,
  onOtherValueChange,
  pricingRules,
  currency,
}: Props) => {
  const t = useTranslations("Configurator")
  const sortedComponents = [...components].sort((a, b) => a.sortOrder - b.sortOrder)

  if (components.length === 0) {
    return (
      <Card className="p-6">
        <Typography
          as="p"
          variant="body-md"
          className="text-muted-foreground"
        >
          {t("components.emptyState")}
        </Typography>
      </Card>
    )
  }

  const configuredCount = sortedComponents.filter((c) => {
    const opts = selectedOptionsByComponent[c.id] ?? {}
    const other = selectedOtherValuesByComponent[c.id] ?? {}
    const attrs = attributesByComponent[c.id] ?? []
    return attrs.some(
      (a) =>
        (a.type === "ENUM" && opts[a.id] != null) ||
        ((a.type === "INTEGER" || a.type === "DECIMAL" || a.type === "BOOLEAN") && a.id in other),
    )
  }).length
  const totalComponents = sortedComponents.length
  const shouldShowProgress = totalComponents > 1 && configuredCount > 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Typography
          as="h2"
          variant="display-sm"
          weight="semibold"
        >
          {t("components.title")}
        </Typography>
        {shouldShowProgress && (
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {t("components.progress", { current: configuredCount, total: totalComponents })}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {sortedComponents.map((component) => {
          const isSelected = component.id === selectedComponentId
          const attributes = attributesByComponent[component.id] ?? []
          const opts = selectedOptionsByComponent[component.id] ?? {}
          const other = selectedOtherValuesByComponent[component.id] ?? {}
          const isConfigured = attributes.some(
            (a) =>
              (a.type === "ENUM" && opts[a.id] != null) ||
              ((a.type === "INTEGER" || a.type === "DECIMAL" || a.type === "BOOLEAN") &&
                a.id in other),
          )

          return (
            <Card
              key={component.id}
              className={cn(
                "cursor-pointer transition-all hover:border-primary/50",
                isSelected && "border-primary shadow-md",
              )}
              onClick={() => onSelectComponent(component.id)}
            >
              <div className="p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <Typography
                    as="h3"
                    variant="body-lg"
                    weight="semibold"
                    className={cn(isSelected && "text-primary")}
                  >
                    {component.label}
                  </Typography>
                  {isConfigured && (
                    <span
                      className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary"
                      aria-hidden
                    >
                      <CheckIcon className="size-3" />
                    </span>
                  )}
                </div>
                <div className="mb-2">
                  {component.description && (
                    <Typography
                      as="p"
                      variant="body-sm"
                      className="mt-0.5 line-clamp-2 text-muted-foreground"
                    >
                      {component.description}
                    </Typography>
                  )}
                </div>

                {isSelected && attributes.length > 0 && (
                  <div className="mt-3 space-y-3 border-t pt-3">
                    <Typography
                      as="h4"
                      variant="body-sm"
                      weight="semibold"
                    >
                      {t("attributes.title")}
                    </Typography>
                    {attributes.map((attr) => (
                      <EmbedAttributeField
                        key={attr.id}
                        attribute={attr}
                        options={optionsByAttribute[attr.id] ?? []}
                        selectedOption={selectedOptionsByComponent[component.id]?.[attr.id] ?? null}
                        onSelectOption={(option) => onSelectOption(component.id, attr.id, option)}
                        otherValue={selectedOtherValuesByComponent[component.id]?.[attr.id]}
                        onOtherChange={(value) => onOtherValueChange(component.id, attr.id, value)}
                        componentId={component.id}
                        pricingRules={pricingRules}
                        currency={currency}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
