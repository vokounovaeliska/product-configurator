import { queryOptions, useMutation, useQuery } from "@tanstack/react-query"

import type { ProductEmbedFullDto } from "@/api/embedTypes"
import { publicApi } from "@/lib/api/restClient"
import { extractErrorMessage } from "@/lib/utils"

export type {
  ConfiguratorPreferencesEmbedDto,
  ProductEmbedFullDto,
  ProductModelEmbedDto,
} from "@/api/embedTypes"

export type CustomerRequestCreateDto = {
  customerName?: string | null
  customerEmail: string
  customerPhone?: string | null
  customerNote?: string | null
  productModelId: string
  productModelName: string
  productModelDescription?: string | null
  currency: string
  totalPrice: number
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
  productConfigById: (id: string) => [...embedKeys.all, "config-by-id", id] as const,
} as const

export const getEmbedProductConfigByIdQueryOptions = (productModelId: string) =>
  queryOptions({
    queryKey: embedKeys.productConfigById(productModelId),
    queryFn: async (): Promise<ProductEmbedFullDto> => {
      const res = await publicApi
        .get(`embed/api/v1/products/by-id/${encodeURIComponent(productModelId)}/config`)
        .json<ProductEmbedFullDto>()
      return res
    },
    enabled: Boolean(productModelId),
  })

export const useEmbedProductConfigById = (
  productModelId: string,
  options?: { enabled?: boolean },
) =>
  useQuery({
    ...getEmbedProductConfigByIdQueryOptions(productModelId),
    enabled: options?.enabled !== false && Boolean(productModelId),
  })

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
