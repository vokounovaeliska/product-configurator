"use client"

import { useQueries } from "@tanstack/react-query"

import { getAttributesListQueryOptions } from "@/api/attributeQueries"
import type { AttributeOptionDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"
import type { AttributePricingRuleDto } from "@/api/pricingTypes"

import { computeModifiersCents } from "../utils/computePriceFromRules"

type SelectedOptionsByComponent = Record<string, Record<string, AttributeOptionDto | null>>
type SelectedOtherValuesByComponent = Record<string, Record<string, number | boolean>>

export type ComputedPriceResult = {
  totalPrice: number
  modifiersCents: number
}

/**
 * Computes total price from base price + pricing rules applied to current selection.
 * No API call — uses the same rules already shown in the option table (e.g. "+ 500 Kč" per option).
 */
export function useComputedPrice(
  productModelId: string,
  basePrice: number,
  components: ComponentDto[],
  selectedOptionsByComponent: SelectedOptionsByComponent,
  selectedOtherValuesByComponent: SelectedOtherValuesByComponent,
  pricingRules: AttributePricingRuleDto[],
): { data: ComputedPriceResult | undefined; isLoading: boolean } {
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
  const isLoading = !hasAllAttributesLoaded

  const data: ComputedPriceResult | undefined =
    hasAllAttributesLoaded && components.length > 0
      ? (() => {
          const modifiersCents = computeModifiersCents(
            pricingRules,
            components,
            attributesByComponent,
            selectedOptionsByComponent,
            selectedOtherValuesByComponent,
          )
          const totalPrice = basePrice + modifiersCents / 100
          return { totalPrice, modifiersCents }
        })()
      : undefined

  return { data, isLoading }
}
