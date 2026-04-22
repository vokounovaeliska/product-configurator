import { useQuery } from "@tanstack/react-query"

import type {
  AttributePricingRuleDto,
  ConfigurationPreviewRequestDto,
  ConfigurationPreviewResponseDto,
} from "@/api/pricingTypes"
import { api } from "@/lib/api/restClient"

export const pricingRulesKeyPrefix = (productModelId: string) =>
  ["product-models", productModelId, "pricing-rules"] as const

export const pricingRulesKey = (
  productModelId: string,
  filter?: { componentId?: string; attributeCode?: string },
) =>
  [
    ...pricingRulesKeyPrefix(productModelId),
    filter?.componentId ?? "",
    filter?.attributeCode ?? "",
  ] as const

type UsePricingRulesListParams = {
  productModelId: string

  componentId?: string
  attributeCode?: string
}

type UsePricingRulesListOptions = {
  enabled?: boolean
}

export const usePricingRulesList = (
  { productModelId, componentId, attributeCode }: UsePricingRulesListParams,
  options?: UsePricingRulesListOptions,
) => {
  const filter =
    componentId != null && componentId !== "" && attributeCode != null && attributeCode !== ""
      ? { componentId, attributeCode }
      : undefined
  const isEnabled = options?.enabled !== false
  return useQuery({
    queryKey: pricingRulesKey(productModelId, filter),
    queryFn: async () => {
      const list = await api
        .get(`products/api/v1/product-models/${productModelId}/pricing-rules`, {
          searchParams: filter ?? {},
        })
        .json<AttributePricingRuleDto[]>()
      return Array.isArray(list) ? list : []
    },
    enabled: isEnabled && Boolean(productModelId),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 2000),
  })
}

export const fetchConfigurationPreview = async (
  productModelId: string,
  body: ConfigurationPreviewRequestDto,
): Promise<ConfigurationPreviewResponseDto> =>
  api
    .post(`products/api/v1/product-models/${productModelId}/configuration-preview`, { json: body })
    .json<ConfigurationPreviewResponseDto>()
