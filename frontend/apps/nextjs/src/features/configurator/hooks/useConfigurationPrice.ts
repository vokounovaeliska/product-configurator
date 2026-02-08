"use client"

import { useQueries, useQuery } from "@tanstack/react-query"

import { getAttributesListQueryOptions } from "@/api/attributeQueries"
import type { AttributeOptionDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"
import { fetchConfigurationPreview } from "@/api/pricingRulesQueries"
import type { ConfigurationPreviewSelectionDto } from "@/api/pricingTypes"

type SelectedOptionsByComponent = Record<string, Record<string, AttributeOptionDto | null>>
type SelectedOtherValuesByComponent = Record<string, Record<string, number | boolean>>

const configurationPreviewKey = (
  productModelId: string,
  selections: ConfigurationPreviewSelectionDto[],
) => ["configuration-preview", productModelId, JSON.stringify(selections)] as const

function buildSelections(
  components: ComponentDto[],
  attributesByComponent: Record<string, { code: string; type: string; id: string }[]>,
  selectedOptionsByComponent: SelectedOptionsByComponent,
  selectedOtherValuesByComponent: SelectedOtherValuesByComponent,
): ConfigurationPreviewSelectionDto[] {
  const selections: ConfigurationPreviewSelectionDto[] = []

  for (const component of components) {
    const attributes = attributesByComponent[component.id] ?? []
    const optionsByAttr = selectedOptionsByComponent[component.id] ?? {}
    const otherByAttr = selectedOtherValuesByComponent[component.id] ?? {}

    for (const attr of attributes) {
      let value: string
      if (attr.type === "ENUM") {
        const option = optionsByAttr[attr.id]
        value = option?.value ?? ""
      } else {
        const raw = otherByAttr[attr.id]
        value = raw !== undefined && raw !== null ? String(raw) : ""
      }
      if (value !== "") {
        selections.push({
          componentId: component.id,
          attributeCode: attr.code,
          value,
        })
      }
    }
  }
  return selections
}

export function useConfigurationPrice(
  productModelId: string,
  components: ComponentDto[],
  selectedOptionsByComponent: SelectedOptionsByComponent,
  selectedOtherValuesByComponent: SelectedOtherValuesByComponent,
) {
  const attributeQueries = useQueries({
    queries: components.map((c) =>
      getAttributesListQueryOptions(productModelId, c.id, { limit: 100 }),
    ),
  })

  const attributesByComponent = Object.fromEntries(
    components.map((c, i) => {
      const items = attributeQueries[i]?.data?.items ?? []
      return [c.id, items.map((a) => ({ code: a.code, type: a.type, id: a.id }))] as const
    }),
  )

  const hasAllAttributesLoaded = attributeQueries.every((q) => q.isSuccess)
  const selections = hasAllAttributesLoaded
    ? buildSelections(
        components,
        attributesByComponent,
        selectedOptionsByComponent,
        selectedOtherValuesByComponent,
      )
    : []

  const previewQuery = useQuery({
    queryKey: configurationPreviewKey(productModelId, selections),
    queryFn: () => fetchConfigurationPreview(productModelId, { selections }),
    enabled: Boolean(productModelId && hasAllAttributesLoaded && components.length > 0),
  })

  return previewQuery
}
