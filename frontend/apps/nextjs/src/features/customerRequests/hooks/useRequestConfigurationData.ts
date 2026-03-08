"use client"

import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import { getAllAttributesForProductModelQueryOptions } from "@/api/attributeQueries"
import type { AttributeDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"

/* eslint-disable import/no-restricted-paths -- request config needs components, configurator types and parametric pipeline */
import { useComponentsList } from "@/features/components/api/componentQueries"
import type { Model3dConfig } from "@/features/configurator/types/model3dConfig"
import type { ComponentTransform } from "@/features/configurator/utils/parametricTransformPipeline"
import {
  computeResolvedDimensions,
  isGroupContainer,
} from "@/features/configurator/utils/parametricTransformPipeline"
import { getProductModelQueryOptions } from "@/features/productModels/api/productModelQueries"

/* eslint-enable import/no-restricted-paths */

import { extractUserChoices } from "../utils/requestConfigDisplay"

type ParsedModel3dEffects = {
  componentTransforms: Record<string, ComponentTransform>
  parameterDefaults: Record<string, number> | null
}

function parseModel3dEffects(json: string | null | undefined): ParsedModel3dEffects | null {
  if (!json?.trim()) return null
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>
    const ct =
      parsed?.componentTransforms != null &&
      typeof parsed.componentTransforms === "object" &&
      !Array.isArray(parsed.componentTransforms)
        ? (parsed.componentTransforms as Record<string, ComponentTransform>)
        : null
    const pd =
      parsed?.parameterDefaults != null &&
      typeof parsed.parameterDefaults === "object" &&
      !Array.isArray(parsed.parameterDefaults)
        ? (parsed.parameterDefaults as Record<string, number>)
        : null
    if (!ct || Object.keys(ct).length === 0) return null
    return { componentTransforms: ct, parameterDefaults: pd }
  } catch {
    return null
  }
}

function buildAttributesByComponent(
  components: ComponentDto[],
  allAttributes: AttributeDto[],
): Record<string, AttributeDto[]> {
  const result: Record<string, AttributeDto[]> = {}
  for (const comp of components) {
    result[comp.id] = allAttributes.filter((a) => a.componentId === comp.id)
  }
  return result
}

export type RequestConfigurationData = {
  userChoices: {
    componentLabel: string
    attributeLabel: string
    displayValue: string
    unit?: string
  }[]
  dimensionItems: {
    componentCode: string
    componentLabel: string
    lenx: number
    leny: number
    lenz: number
    unit: string
  }[]
  isLoading: boolean
  hasDimensions: boolean
}

export function useRequestConfigurationData(
  config: Record<string, unknown> | null,
  productModelId: string | null,
  options?: { enabled?: boolean },
): RequestConfigurationData {
  const isFetchEnabled = options?.enabled !== false && Boolean(productModelId)
  const productModelQuery = useQuery({
    ...getProductModelQueryOptions(productModelId ?? ""),
    enabled: isFetchEnabled,
  })
  const componentsQuery = useComponentsList(
    productModelId ?? "",
    { limit: 100 },
    {
      enabled: isFetchEnabled,
    },
  )
  const attributesQuery = useQuery({
    ...getAllAttributesForProductModelQueryOptions(productModelId ?? ""),
    enabled: isFetchEnabled && (componentsQuery.data?.items?.length ?? 0) > 0,
  })

  const productModel = productModelQuery.data
  const components = useMemo(() => componentsQuery.data?.items ?? [], [componentsQuery.data?.items])
  const allAttributes = useMemo(() => attributesQuery.data ?? [], [attributesQuery.data])
  const attributesByComponent = useMemo(
    () => buildAttributesByComponent(components, allAttributes),
    [components, allAttributes],
  )

  const parsedEffects = useMemo(
    () => parseModel3dEffects(productModel?.model3dEffects ?? null),
    [productModel?.model3dEffects],
  )

  const model3dConfig = useMemo((): Model3dConfig | null => {
    if (!config || !components.length) return null
    return {
      components,
      attributesByComponent,
      selectedOptionsByComponent:
        (config.selectedOptionsByComponent as Model3dConfig["selectedOptionsByComponent"]) ?? {},
      selectedOtherValuesByComponent:
        (config.selectedOtherValuesByComponent as Model3dConfig["selectedOtherValuesByComponent"]) ??
        {},
    }
  }, [config, components, attributesByComponent])

  const resolvedDimensions = useMemo(() => {
    if (!parsedEffects?.componentTransforms || !model3dConfig) return null
    return computeResolvedDimensions(
      parsedEffects.componentTransforms,
      model3dConfig,
      parsedEffects.parameterDefaults,
    )
  }, [parsedEffects, model3dConfig])

  const dimensionItems = useMemo(() => {
    if (!resolvedDimensions) return []
    const transforms = parsedEffects?.componentTransforms ?? {}
    return Object.entries(resolvedDimensions)
      .filter(([compCode, dims]) => {
        const t = transforms[compCode]
        if (!t) return false
        if (isGroupContainer(t)) return false
        return dims.lenx > 0 || dims.leny > 0 || dims.lenz > 0
      })
      .map(([compCode, dims]) => {
        const comp = components.find((c) => c.code === compCode)
        return {
          componentCode: compCode,
          componentLabel: comp?.label ?? comp?.code ?? compCode,
          lenx: dims.lenx,
          leny: dims.leny,
          lenz: dims.lenz,
          unit: "cm",
        }
      })
  }, [resolvedDimensions, parsedEffects?.componentTransforms, components])

  const userChoices = useMemo(
    () => extractUserChoices(config, components, attributesByComponent),
    [config, components, attributesByComponent],
  )

  const isLoading =
    (Boolean(productModelId) && productModelQuery.isLoading) ||
    (Boolean(productModelId) && componentsQuery.isLoading) ||
    (Boolean(productModelId) && attributesQuery.isLoading)

  return {
    userChoices,
    dimensionItems,
    isLoading,
    hasDimensions: dimensionItems.length > 0,
  }
}
