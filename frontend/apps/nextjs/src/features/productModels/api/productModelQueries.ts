import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  ProductModelCreateRequestDto,
  ProductModelDto,
  ProductModelListQueryParams,
  ProductModelPaginatedResponseDto,
  ProductModelPatchRequestDto,
} from "@/api/productModelTypes"
import { api } from "@/lib/api/restClient"
import { extractErrorMessage } from "@/lib/utils"

/**
 * Query key factory for product model queries
 */
export const productModelKeys = {
  all: ["productModels"] as const,
  lists: () => [...productModelKeys.all, "list"] as const,
  list: (params?: ProductModelListQueryParams) => [...productModelKeys.lists(), params] as const,
  details: () => [...productModelKeys.all, "detail"] as const,
  detail: (id: string) => [...productModelKeys.details(), id] as const,
} as const

/**
 * Query options for fetching paginated list of product models
 */
export const getProductModelsListQueryOptions = (params?: ProductModelListQueryParams) =>
  queryOptions({
    queryKey: productModelKeys.list(params),
    queryFn: async (): Promise<ProductModelPaginatedResponseDto> => {
      try {
        const searchParams = new URLSearchParams()
        if (params?.limit) searchParams.append("limit", params.limit.toString())
        if (params?.after) searchParams.append("after", params.after)
        if (params?.before) searchParams.append("before", params.before)
        if (params?.orderBy) {
          params.orderBy.forEach((order) => searchParams.append("orderBy", order))
        }
        if (params?.ids) {
          params.ids.forEach((id) => searchParams.append("ids", id))
        }
        if (params?.userIds) {
          params.userIds.forEach((userId) => searchParams.append("userIds", userId))
        }
        if (params?.isActive !== undefined) {
          searchParams.append("isActive", params.isActive.toString())
        }

        const queryString = searchParams.toString()
        const url = `products/api/v1/product-models${queryString ? `?${queryString}` : ""}`

        return await api.get(url).json<ProductModelPaginatedResponseDto>()
      } catch (error) {
        // Re-throw with a more user-friendly error message
        const message = await extractErrorMessage(error)
        throw new Error(message)
      }
    },
  })

/**
 * Query options for fetching a single product model
 */
export const getProductModelQueryOptions = (id: string) =>
  queryOptions({
    queryKey: productModelKeys.detail(id),
    queryFn: async (): Promise<ProductModelDto> => {
      return api.get(`products/api/v1/product-models/${id}`).json<ProductModelDto>()
    },
  })

/**
 * Hook to fetch paginated list of product models
 */
export const useProductModelsList = (params?: ProductModelListQueryParams) => {
  return useQuery(getProductModelsListQueryOptions(params))
}

/**
 * Hook to fetch a single product model
 */
export const useProductModel = (id: string, options?: { enabled?: boolean }) => {
  return useQuery({
    ...getProductModelQueryOptions(id),
    enabled: options?.enabled !== false && Boolean(id),
  })
}

/**
 * Hook to create a product model
 */
export const useCreateProductModel = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ProductModelCreateRequestDto): Promise<ProductModelDto> => {
      try {
        return await api
          .post("products/api/v1/product-models", {
            json: data,
          })
          .json<ProductModelDto>()
      } catch (error) {
        // Re-throw with a more user-friendly error message
        const message = await extractErrorMessage(error)
        throw new Error(message)
      }
    },
    onSuccess: () => {
      // Invalidate and refetch product models list
      void queryClient.invalidateQueries({ queryKey: productModelKeys.lists() })
    },
  })
}

/**
 * Hook to update a product model (PATCH)
 */
export const useUpdateProductModel = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      patches,
    }: {
      id: string
      patches: ProductModelPatchRequestDto[]
    }): Promise<ProductModelDto> => {
      try {
        return await api
          .patch(`products/api/v1/product-models/${id}`, {
            json: patches,
            headers: {
              "content-type": "application/json-patch+json",
            },
          })
          .json<ProductModelDto>()
      } catch (error) {
        // Re-throw with a more user-friendly error message
        const message = await extractErrorMessage(error)
        throw new Error(message)
      }
    },
    onSuccess: (data) => {
      // Invalidate both list and detail queries
      void queryClient.invalidateQueries({ queryKey: productModelKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: productModelKeys.detail(data.id) })
    },
  })
}

/**
 * Hook to delete a product model
 */
export const useDeleteProductModel = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      try {
        return await api.delete(`products/api/v1/product-models/${id}`).then(() => undefined)
      } catch (error) {
        // Re-throw with a more user-friendly error message
        const message = await extractErrorMessage(error)
        throw new Error(message)
      }
    },
    onSuccess: () => {
      // Invalidate product models list
      void queryClient.invalidateQueries({ queryKey: productModelKeys.lists() })
    },
  })
}
