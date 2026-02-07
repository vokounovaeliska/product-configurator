import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  AttributeCreateRequestDto,
  AttributeDto,
  AttributeListQueryParams,
  AttributePaginatedResponseDto,
  AttributePatchRequestDto,
} from "@/api/attributeTypes"
import { api } from "@/lib/api/restClient"
import { extractErrorMessage } from "@/lib/utils"

/**
 * Query key factory for attribute queries
 */
export const attributeKeys = {
  all: ["attributes"] as const,
  lists: () => [...attributeKeys.all, "list"] as const,
  list: (productModelId: string, componentId: string, params?: AttributeListQueryParams) =>
    [...attributeKeys.lists(), productModelId, componentId, params] as const,
  details: () => [...attributeKeys.all, "detail"] as const,
  detail: (productModelId: string, componentId: string, attributeId: string) =>
    [...attributeKeys.details(), productModelId, componentId, attributeId] as const,
} as const

/**
 * Query options for fetching paginated list of attributes for a component
 */
export const getAttributesListQueryOptions = (
  productModelId: string,
  componentId: string,
  params?: AttributeListQueryParams,
) =>
  queryOptions({
    queryKey: attributeKeys.list(productModelId, componentId, params),
    queryFn: async (): Promise<AttributePaginatedResponseDto> => {
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
        if (params?.types) {
          params.types.forEach((type) => searchParams.append("types", type))
        }

        const queryString = searchParams.toString()
        const url = `products/api/v1/product-models/${productModelId}/components/${componentId}/attributes${queryString ? `?${queryString}` : ""}`

        return await api.get(url).json<AttributePaginatedResponseDto>()
      } catch (error) {
        const message = await extractErrorMessage(error)
        throw new Error(message)
      }
    },
  })

/**
 * Query options for fetching a single attribute
 */
export const getAttributeQueryOptions = (
  productModelId: string,
  componentId: string,
  attributeId: string,
) =>
  queryOptions({
    queryKey: attributeKeys.detail(productModelId, componentId, attributeId),
    queryFn: async (): Promise<AttributeDto> => {
      return api
        .get(
          `products/api/v1/product-models/${productModelId}/components/${componentId}/attributes/${attributeId}`,
        )
        .json<AttributeDto>()
    },
  })

/**
 * Hook to fetch paginated list of attributes for a component
 */
export const useAttributesList = (
  productModelId: string,
  componentId: string,
  params?: AttributeListQueryParams,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    ...getAttributesListQueryOptions(productModelId, componentId, params),
    enabled: options?.enabled !== false && Boolean(productModelId) && Boolean(componentId),
  })
}

/**
 * Hook to fetch a single attribute
 */
export const useAttribute = (productModelId: string, componentId: string, attributeId: string) => {
  return useQuery(getAttributeQueryOptions(productModelId, componentId, attributeId))
}

/**
 * Hook to create an attribute
 */
export const useCreateAttribute = (productModelId: string, componentId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AttributeCreateRequestDto): Promise<AttributeDto> => {
      try {
        return await api
          .post(
            `products/api/v1/product-models/${productModelId}/components/${componentId}/attributes`,
            {
              json: data,
            },
          )
          .json<AttributeDto>()
      } catch (error) {
        const message = await extractErrorMessage(error)
        throw new Error(message)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: attributeKeys.lists() })
    },
  })
}

/**
 * Hook to update an attribute (PATCH)
 */
export const useUpdateAttribute = (productModelId: string, componentId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      attributeId,
      patches,
    }: {
      attributeId: string
      patches: AttributePatchRequestDto[]
    }): Promise<AttributeDto> => {
      try {
        return await api
          .patch(
            `products/api/v1/product-models/${productModelId}/components/${componentId}/attributes/${attributeId}`,
            {
              json: patches,
              headers: {
                "content-type": "application/json-patch+json",
              },
            },
          )
          .json<AttributeDto>()
      } catch (error) {
        const message = await extractErrorMessage(error)
        throw new Error(message)
      }
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: attributeKeys.lists() })
      void queryClient.invalidateQueries({
        queryKey: attributeKeys.detail(productModelId, componentId, variables.attributeId),
      })
    },
  })
}

/**
 * Hook to delete an attribute
 */
export const useDeleteAttribute = (productModelId: string, componentId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (attributeId: string): Promise<void> => {
      try {
        return await api
          .delete(
            `products/api/v1/product-models/${productModelId}/components/${componentId}/attributes/${attributeId}`,
          )
          .then(() => undefined)
      } catch (error) {
        const message = await extractErrorMessage(error)
        throw new Error(message)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: attributeKeys.lists() })
    },
  })
}
