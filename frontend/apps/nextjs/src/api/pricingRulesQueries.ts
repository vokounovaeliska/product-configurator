import { useQuery } from "@tanstack/react-query"

import type {
  AttributePricingRuleDto,
  ConfigurationPreviewRequestDto,
  ConfigurationPreviewResponseDto,
} from "@/api/pricingTypes"
import { api } from "@/lib/api/restClient"

export const pricingRulesKey = (productModelId: string) =>
  ["product-models", productModelId, "pricing-rules"] as const

export const usePricingRulesList = (productModelId: string) =>
  useQuery({
    queryKey: pricingRulesKey(productModelId),
    queryFn: async () => {
      const list = await api
        .get(`products/api/v1/product-models/${productModelId}/pricing-rules`)
        .json<AttributePricingRuleDto[]>()
      return list
    },
    enabled: Boolean(productModelId),
  })

export const fetchConfigurationPreview = async (
  productModelId: string,
  body: ConfigurationPreviewRequestDto,
): Promise<ConfigurationPreviewResponseDto> =>
  api
    .post(`products/api/v1/product-models/${productModelId}/configuration-preview`, { json: body })
    .json<ConfigurationPreviewResponseDto>()
