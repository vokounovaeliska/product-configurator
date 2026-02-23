import { useMemo } from "react"
import { useQueries } from "@tanstack/react-query"

import { getAttributesListQueryOptions } from "@/api/attributeQueries"
import type { AttributeDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"

export type ConfiguratorAttributesByComponent = Record<string, AttributeDto[]>

export function useConfiguratorAttributes(
  productModelId: string,
  components: ComponentDto[],
): { attributesByComponent: ConfiguratorAttributesByComponent; isLoading: boolean } {
  const queries = useQueries({
    queries: components.map((c) =>
      getAttributesListQueryOptions(productModelId, c.id, { limit: 50 }),
    ),
  })

  const isLoading = queries.some((q) => q.isLoading)

  const attributesByComponent = useMemo(() => {
    const result: ConfiguratorAttributesByComponent = {}
    components.forEach((c, i) => {
      result[c.id] = queries[i]?.data?.items ?? []
    })
    return result
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally depend on data references, not query objects
  }, [components, ...components.map((_, i) => queries[i]?.data)])

  return {
    attributesByComponent,
    isLoading,
  }
}
