"use client"

import { useTranslations } from "next-intl"
import { Card } from "@workspace/ui/components/card"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import type { AttributeOptionDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"

import { AttributeConfiguration } from "./AttributeConfiguration"

type SelectedOptionsByComponent = Record<string, Record<string, AttributeOptionDto | null>>

type Props = {
  components: ComponentDto[]
  selectedComponentId: string | null
  onSelectComponent: (componentId: string) => void
  productModelId: string
  selectedOptionsByComponent: SelectedOptionsByComponent
  onSelectOption: (
    componentId: string,
    attributeId: string,
    option: AttributeOptionDto | null,
  ) => void
}

export const ComponentSelector = ({
  components,
  selectedComponentId,
  onSelectComponent,
  productModelId,
  selectedOptionsByComponent,
  onSelectOption,
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

  return (
    <div className="space-y-4">
      <Typography
        as="h2"
        variant="display-md"
        weight="semibold"
      >
        {t("components.title")}
      </Typography>

      <div className="space-y-3">
        {sortedComponents.map((component) => {
          const isSelected = component.id === selectedComponentId

          return (
            <Card
              key={component.id}
              className={cn(
                "cursor-pointer transition-all hover:border-primary/50",
                isSelected && "border-primary shadow-md",
              )}
              onClick={() => onSelectComponent(component.id)}
            >
              <div className="p-4">
                <div className="mb-3">
                  <Typography
                    as="h3"
                    variant="display-sm"
                    weight="semibold"
                    className={cn(isSelected && "text-primary")}
                  >
                    {component.label}
                  </Typography>
                  {component.description && (
                    <Typography
                      as="p"
                      variant="body-sm"
                      className="mt-1 text-muted-foreground"
                    >
                      {component.description}
                    </Typography>
                  )}
                </div>

                {isSelected && (
                  <div className="mt-4 border-t pt-4">
                    <AttributeConfiguration
                      componentId={component.id}
                      productModelId={productModelId}
                      selectedOptionsByAttribute={selectedOptionsByComponent[component.id] ?? {}}
                      onSelectOption={(attributeId, option) =>
                        onSelectOption(component.id, attributeId, option)
                      }
                    />
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
