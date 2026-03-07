import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

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

type CustomerRequestProductModelDto = {
  id: string
  name: string
}

type CustomerRequestProductModelsResponseDto = {
  items: CustomerRequestProductModelDto[]
}

export const customerRequestKeys = {
  all: ["customer-requests"] as const,
  list: () => [...customerRequestKeys.all, "list"] as const,
  detail: (id: string) => [...customerRequestKeys.all, "detail", id] as const,
  productModels: () => [...customerRequestKeys.all, "product-models"] as const,
}

export type CustomerRequestsListParams = {
  limit?: number
  after?: string
  productModelId?: string | null
  fromDate?: string | null
  toDate?: string | null
}

export const getCustomerRequestsListQueryOptions = (params?: CustomerRequestsListParams) =>
  queryOptions({
    queryKey: [
      ...customerRequestKeys.list(),
      params?.limit ?? 20,
      params?.after,
      params?.productModelId,
      params?.fromDate,
      params?.toDate,
    ],
    queryFn: async (): Promise<CustomerRequestDto[]> => {
      const searchParams = new URLSearchParams()
      if (params?.limit != null) searchParams.set("limit", String(params.limit))
      if (params?.after != null) searchParams.set("after", params.after)
      if (params?.productModelId != null && params.productModelId !== "") {
        searchParams.set("productModelId", params.productModelId)
      }
      if (params?.fromDate != null && params.fromDate !== "") {
        searchParams.set("fromDate", params.fromDate)
      }
      if (params?.toDate != null && params.toDate !== "") {
        searchParams.set("toDate", params.toDate)
      }
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

export const getCustomerRequestProductModelsQueryOptions = (limit = 100) =>
  queryOptions({
    queryKey: [...customerRequestKeys.productModels(), limit],
    queryFn: async (): Promise<CustomerRequestProductModelsResponseDto> => {
      const searchParams = new URLSearchParams()
      searchParams.set("limit", String(limit))
      const query = searchParams.toString()
      return api
        .get(`products/api/v1/product-models${query ? `?${query}` : ""}`)
        .json<CustomerRequestProductModelsResponseDto>()
    },
  })

export const useCustomerRequestsList = (params?: CustomerRequestsListParams) =>
  useQuery(getCustomerRequestsListQueryOptions(params))

export const useCustomerRequest = (id: string) => useQuery(getCustomerRequestQueryOptions(id))

export const useCustomerRequestProductModels = (limit?: number) =>
  useQuery(getCustomerRequestProductModelsQueryOptions(limit))

export const useUpdateCustomerRequestStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string
      status: string
    }): Promise<CustomerRequestDto> =>
      api
        .patch(`products/api/v1/customer-requests/${id}/status`, { json: { status } })
        .json<CustomerRequestDto>(),
    onSuccess: (data) => {
      queryClient.setQueryData(customerRequestKeys.detail(data.id), data)
      queryClient.setQueriesData(
        { queryKey: customerRequestKeys.list() },
        (old: CustomerRequestDto[] | undefined) =>
          old?.map((r) => (r.id === data.id ? data : r)) ?? old,
      )
    },
  })
}
