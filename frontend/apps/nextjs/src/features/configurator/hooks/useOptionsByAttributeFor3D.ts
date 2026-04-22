import { useMemo } from "react"
import { useQueries } from "@tanstack/react-query"

import { getAttributeOptionsListQueryOptions } from "@/api/attributeOptionQueries"
import type { AttributeDto, AttributeOptionDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"

export function useOptionsByAttributeFor3D(
  productModelId: string,
  components: ComponentDto[],
  attributesByComponent: Record<string, AttributeDto[]>,
  isEnabled: boolean,
): Record<string, AttributeOptionDto[]> {
  const attributeKeys = useMemo(() => {
    const keys: { componentId: string; attributeId: string }[] = []
    components.forEach((c) => {
      const attrs = attributesByComponent[c.id] ?? []
      attrs
        .filter((a) => a.type === "ENUM")
        .forEach((a) => keys.push({ componentId: c.id, attributeId: a.id }))
    })
    return keys
  }, [components, attributesByComponent])

  const queries = useQueries({
    queries: attributeKeys.map(({ componentId, attributeId }) => ({
      ...getAttributeOptionsListQueryOptions(productModelId, componentId, attributeId),
      enabled: isEnabled && attributeKeys.length > 0,
    })),
  })

  const queryData = queries.map((q) => q.data)

  return useMemo(() => {
    const result: Record<string, AttributeOptionDto[]> = {}
    attributeKeys.forEach(({ attributeId }, i) => {
      const data = queryData[i]
      result[attributeId] = Array.isArray(data) ? data : []
    })
    return result
  }, [attributeKeys, queryData])
}
