import { queryOptions, useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api/restClient"

export type CustomerRequestDto = {
  id: string
  status: string
  customerName: string | null
  customerEmail: string
  customerPhone: string | null
  customerNote: string | null
  productModelId: string | null
  productModelName: string
  productModelDescription: string | null
  currency: string
  totalPriceCents: number
  configurationJson: Record<string, unknown>
  pricingBreakdownJson: Record<string, unknown> | null
  snapshotImageBase64: string | null
  createdAt: string
  modifiedAt: string
}

export const customerRequestKeys = {
  all: ["customer-requests"] as const,
  list: () => [...customerRequestKeys.all, "list"] as const,
  detail: (id: string) => [...customerRequestKeys.all, "detail", id] as const,
}

export const getCustomerRequestsListQueryOptions = (params?: { limit?: number; after?: string }) =>
  queryOptions({
    queryKey: [...customerRequestKeys.list(), params?.limit ?? 20, params?.after],
    queryFn: async (): Promise<CustomerRequestDto[]> => {
      const searchParams = new URLSearchParams()
      if (params?.limit != null) searchParams.set("limit", String(params.limit))
      if (params?.after != null) searchParams.set("after", params.after)
      const query = searchParams.toString()
      const url = `products/api/v1/customer-requests${query ? `?${query}` : ""}`
      return api.get(url).json<CustomerRequestDto[]>()
    },
  })

export const getCustomerRequestQueryOptions = (id: string) =>
  queryOptions({
    queryKey: customerRequestKeys.detail(id),
    queryFn: async (): Promise<CustomerRequestDto> =>
      api.get(`products/api/v1/customer-requests/${id}`).json<CustomerRequestDto>(),
    enabled: Boolean(id),
  })

export const useCustomerRequestsList = (params?: { limit?: number; after?: string }) =>
  useQuery(getCustomerRequestsListQueryOptions(params))

export const useCustomerRequest = (id: string) => useQuery(getCustomerRequestQueryOptions(id))
