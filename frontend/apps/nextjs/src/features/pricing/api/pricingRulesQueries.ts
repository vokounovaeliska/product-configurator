import { useMutation, useQueryClient } from "@tanstack/react-query"

import { pricingRulesKeyPrefix } from "@/api/pricingRulesQueries"
import type {
  AttributePricingRuleCreateDto,
  AttributePricingRuleDto,
  AttributePricingRuleUpdateDto,
} from "@/api/pricingTypes"
import { api } from "@/lib/api/restClient"

export { usePricingRulesList } from "@/api/pricingRulesQueries"

export const useCreatePricingRule = (productModelId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: AttributePricingRuleCreateDto) => {
      return api
        .post(`products/api/v1/product-models/${productModelId}/pricing-rules`, {
          json: body,
        })
        .json<AttributePricingRuleDto>()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pricingRulesKeyPrefix(productModelId) })
    },
  })
}

export const useUpdatePricingRule = (productModelId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      ruleId,
      body,
    }: {
      ruleId: string
      body: AttributePricingRuleUpdateDto
    }) => {
      return api
        .put(`products/api/v1/product-models/${productModelId}/pricing-rules/${ruleId}`, {
          json: body,
        })
        .json<AttributePricingRuleDto>()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pricingRulesKeyPrefix(productModelId) })
    },
  })
}

export const useDeletePricingRule = (productModelId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (ruleId: string) => {
      await api.delete(`products/api/v1/product-models/${productModelId}/pricing-rules/${ruleId}`)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pricingRulesKeyPrefix(productModelId) })
    },
  })
}
