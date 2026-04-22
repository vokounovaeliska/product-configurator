import { useMemo } from "react"
import { useQueries, useQuery } from "@tanstack/react-query"

import { getAttributeOptionsListQueryOptions } from "@/api/attributeOptionQueries"
import { getAttributesListQueryOptions } from "@/api/attributeQueries"
import type { AttributeOptionDto } from "@/api/attributeTypes"

/* eslint-disable import/no-restricted-paths -- default preview needs components list */
import { getComponentsListQueryOptions } from "@/features/components/api/componentQueries"

/* eslint-enable import/no-restricted-paths */

export type PreviewLayer = {
  id: string
  imageUrl: string
  zIndex: number
}

export function useDefaultPreviewLayers(
  productModelId: string,
  isEnabled: boolean,
): { layers: PreviewLayer[]; isLoading: boolean } {
  const componentsQuery = useQuery({
    ...getComponentsListQueryOptions(productModelId, { limit: 20 }),
    enabled: isEnabled && Boolean(productModelId),
  })

  const components = useMemo(() => componentsQuery.data?.items ?? [], [componentsQuery.data])
  const attributesQueries = useQueries({
    queries: components.map((c) => ({
      ...getAttributesListQueryOptions(productModelId, c.id, { limit: 50 }),
      enabled: isEnabled && components.length > 0,
    })),
  })

  const attributesData = attributesQueries.map((q) => q.data?.items ?? [])
  const attributesByComponent = useMemo(() => {
    const result: Record<string, { id: string; type: string }[]> = {}
    components.forEach((c, i) => {
      const data = attributesData[i] ?? []
      result[c.id] = data.map((a) => ({ id: a.id, type: a.type }))
    })
    return result
  }, [components, attributesData])

  const attributeKeys = useMemo(() => {
    const keys: { componentId: string; componentImageZIndex: number; attributeId: string }[] = []
    components.forEach((c) => {
      const attrs = attributesByComponent[c.id] ?? []
      attrs
        .filter((a) => a.type === "ENUM")
        .forEach((a) =>
          keys.push({
            componentId: c.id,
            componentImageZIndex: c.imageZIndex,
            attributeId: a.id,
          }),
        )
    })
    return keys
  }, [components, attributesByComponent])

  const optionsQueries = useQueries({
    queries: attributeKeys.map(({ componentId, attributeId }) => ({
      ...getAttributeOptionsListQueryOptions(productModelId, componentId, attributeId),
      enabled: isEnabled && attributeKeys.length > 0,
    })),
  })

  const optionsData = optionsQueries.map((q) => q.data)
  const layers = useMemo((): PreviewLayer[] => {
    const result: PreviewLayer[] = []
    attributeKeys.forEach(({ componentImageZIndex }, i) => {
      const options = optionsData[i] ?? []
      const firstWithImage = [...options]
        .filter((o): o is AttributeOptionDto & { imageUrl: string } => Boolean(o?.imageUrl?.trim()))
        .sort((a, b) => a.sortOrder - b.sortOrder)[0]
      if (firstWithImage) {
        result.push({
          id: firstWithImage.id,
          imageUrl: firstWithImage.imageUrl,
          zIndex: componentImageZIndex * 1000 + firstWithImage.sortOrder,
        })
      }
    })
    return result.sort((a, b) => a.zIndex - b.zIndex)
  }, [attributeKeys, optionsData])

  const isLoading =
    componentsQuery.isLoading ||
    attributesQueries.some((q) => q.isLoading) ||
    optionsQueries.some((q) => q.isLoading)

  return { layers, isLoading }
}
