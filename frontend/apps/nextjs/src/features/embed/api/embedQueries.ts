import { queryOptions, useMutation, useQuery } from "@tanstack/react-query"

import type { AttributeDto, AttributeOptionDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"
import type { AttributePricingRuleDto } from "@/api/pricingTypes"
import { publicApi } from "@/lib/api/restClient"
import { extractErrorMessage } from "@/lib/utils"

export type ProductModelEmbedDto = {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  model3dUrl: string | null
  model3dEffects: string | null
  url: string | null
}

export type ConfiguratorPreferencesEmbedDto = {
  zoomDistanceDefault: number | null
  zoomDistanceEmbed: number | null
  embedShowProductName: boolean | null
  embedShowDescription: boolean | null
  embedShowComponents: boolean | null
  backgroundPreset: string | null
}

export type ProductEmbedFullDto = {
  product: ProductModelEmbedDto
  components: ComponentDto[]
  attributesByComponent: Record<string, AttributeDto[]>
  optionsByAttribute: Record<string, AttributeOptionDto[]>
  pricingRules: AttributePricingRuleDto[]
  configuratorPreferences?: ConfiguratorPreferencesEmbedDto | null
}

export type CustomerRequestCreateDto = {
  customerName?: string | null
  customerEmail: string
  customerPhone?: string | null
  customerNote?: string | null
  productModelId: string
  productModelName: string
  productModelDescription?: string | null
  currency: string
  totalPriceCents: number
  configurationJson: unknown
  pricingBreakdownJson?: unknown
  snapshotImageBase64?: string | null
}

export type CustomerRequestEmbedDto = {
  id: string
  status: string
}

export const embedKeys = {
  all: ["embed"] as const,
  productConfig: (url: string) => [...embedKeys.all, "config", url] as const,
} as const

export const getEmbedProductConfigQueryOptions = (url: string) =>
  queryOptions({
    queryKey: embedKeys.productConfig(url),
    queryFn: async (): Promise<ProductEmbedFullDto> => {
      const res = await publicApi
        .get(`embed/api/v1/products/by-url/${encodeURIComponent(url)}/config`)
        .json<ProductEmbedFullDto>()
      return res
    },
    enabled: Boolean(url),
  })

export const useEmbedProductConfig = (url: string) =>
  useQuery(getEmbedProductConfigQueryOptions(url))

export const useCreateCustomerRequest = () =>
  useMutation({
    mutationFn: async (data: CustomerRequestCreateDto): Promise<CustomerRequestEmbedDto> => {
      try {
        return await publicApi
          .post("embed/api/v1/customer-requests", { json: data })
          .json<CustomerRequestEmbedDto>()
      } catch (error) {
        const message = await extractErrorMessage(error)
        throw new Error(message)
      }
    },
  })
