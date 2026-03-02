"use client"

import { useEffect, useState } from "react"
import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query"

import { getAttributesListQueryOptions } from "@/api/attributeQueries"
import type { AttributeOptionDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"
import { fetchConfigurationPreview } from "@/api/pricingRulesQueries"
import type { ConfigurationPreviewSelectionDto } from "@/api/pricingTypes"

type SelectedOptionsByComponent = Record<string, Record<string, AttributeOptionDto | null>>
type SelectedOtherValuesByComponent = Record<string, Record<string, number | boolean>>

const PREVIEW_DEBOUNCE_MS = 80

const configurationPreviewKey = (
  productModelId: string,
  selections: ConfigurationPreviewSelectionDto[],
) => ["configuration-preview", productModelId, JSON.stringify(selections)] as const

type AttributeForSelection = {
  code: string
  type: string
  id: string
  defaultInt?: number | null
  defaultDecimal?: number | null
  minInt?: number | null
  minDecimal?: number | null
}

function buildSelections(
  components: ComponentDto[],
  attributesByComponent: Record<string, AttributeForSelection[]>,
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
      } else if (attr.type === "INTEGER" || attr.type === "DECIMAL") {
        const raw = otherByAttr[attr.id]
        const fallback =
          attr.type === "INTEGER"
            ? (attr.defaultInt ?? attr.minInt ?? 0)
            : (attr.defaultDecimal ?? attr.minDecimal ?? 0)
        value =
          raw !== undefined && raw !== null && typeof raw === "number"
            ? String(raw)
            : String(fallback)
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
      return [
        c.id,
        items.map((a) => ({
          code: a.code,
          type: a.type,
          id: a.id,
          defaultInt: a.defaultInt,
          defaultDecimal: a.defaultDecimal,
          minInt: a.minInt,
          minDecimal: a.minDecimal,
        })),
      ] as const
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

  const selectionsKey = JSON.stringify(selections)
  const [debouncedSelectionsKey, setDebouncedSelectionsKey] = useState(selectionsKey)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSelectionsKey(selectionsKey), PREVIEW_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [selectionsKey])

  const debouncedSelections =
    debouncedSelectionsKey === selectionsKey
      ? selections
      : (JSON.parse(debouncedSelectionsKey) as ConfigurationPreviewSelectionDto[])

  const previewQuery = useQuery({
    queryKey: configurationPreviewKey(productModelId, debouncedSelections),
    queryFn: () => fetchConfigurationPreview(productModelId, { selections: debouncedSelections }),
    enabled: Boolean(productModelId && hasAllAttributesLoaded && components.length > 0),
    placeholderData: keepPreviousData,
  })

  return previewQuery
}
