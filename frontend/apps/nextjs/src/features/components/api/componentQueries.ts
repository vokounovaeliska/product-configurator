import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  ComponentCreateRequestDto,
  ComponentDto,
  ComponentListQueryParams,
  ComponentPaginatedResponseDto,
  ComponentPatchRequestDto,
} from "@/api/componentTypes"
import { api } from "@/lib/api/restClient"
import { extractErrorMessage } from "@/lib/utils"

/**
 * Query key factory for component queries
 */
export const componentKeys = {
  all: ["components"] as const,
  lists: () => [...componentKeys.all, "list"] as const,
  list: (productModelId: string, params?: ComponentListQueryParams) =>
    [...componentKeys.lists(), productModelId, params] as const,
  details: () => [...componentKeys.all, "detail"] as const,
  detail: (productModelId: string, componentId: string) =>
    [...componentKeys.details(), productModelId, componentId] as const,
} as const

/**
 * Query options for fetching paginated list of components for a product model
 */
export const getComponentsListQueryOptions = (
  productModelId: string,
  params?: ComponentListQueryParams,
) =>
  queryOptions({
    queryKey: componentKeys.list(productModelId, params),
    queryFn: async (): Promise<ComponentPaginatedResponseDto> => {
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

        const queryString = searchParams.toString()
        const url = `products/api/v1/product-models/${productModelId}/components${queryString ? `?${queryString}` : ""}`

        return await api.get(url).json<ComponentPaginatedResponseDto>()
      } catch (error) {
        const message = await extractErrorMessage(error)
        throw new Error(message)
      }
    },
  })

/**
 * Query options for fetching a single component
 */
export const getComponentQueryOptions = (productModelId: string, componentId: string) =>
  queryOptions({
    queryKey: componentKeys.detail(productModelId, componentId),
    queryFn: async (): Promise<ComponentDto> => {
      return api
        .get(`products/api/v1/product-models/${productModelId}/components/${componentId}`)
        .json<ComponentDto>()
    },
  })

/**
 * Hook to fetch paginated list of components for a product model
 */
export const useComponentsList = (
  productModelId: string,
  params?: ComponentListQueryParams,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    ...getComponentsListQueryOptions(productModelId, params),
    enabled: options?.enabled !== false && Boolean(productModelId),
  })
}

/**
 * Hook to fetch a single component
 */
export const useComponent = (productModelId: string, componentId: string) => {
  return useQuery(getComponentQueryOptions(productModelId, componentId))
}

/**
 * Hook to create a component
 */
export const useCreateComponent = (productModelId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ComponentCreateRequestDto): Promise<ComponentDto> => {
      try {
        return await api
          .post(`products/api/v1/product-models/${productModelId}/components`, {
            json: data,
          })
          .json<ComponentDto>()
      } catch (error) {
        const message = await extractErrorMessage(error)
        throw new Error(message)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: componentKeys.lists() })
    },
  })
}

/**
 * Hook to update a component (PATCH)
 */
export const useUpdateComponent = (productModelId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      componentId,
      patches,
    }: {
      componentId: string
      patches: ComponentPatchRequestDto[]
    }): Promise<ComponentDto> => {
      try {
        return await api
          .patch(`products/api/v1/product-models/${productModelId}/components/${componentId}`, {
            json: patches,
            headers: {
              "content-type": "application/json-patch+json",
            },
          })
          .json<ComponentDto>()
      } catch (error) {
        const message = await extractErrorMessage(error)
        throw new Error(message)
      }
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: componentKeys.lists() })
      void queryClient.invalidateQueries({
        queryKey: componentKeys.detail(productModelId, variables.componentId),
      })
      void queryClient.invalidateQueries({ queryKey: ["embed"] })
    },
  })
}

/**
 * Hook to delete a component
 */
export const useDeleteComponent = (productModelId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (componentId: string): Promise<void> => {
      try {
        return await api
          .delete(`products/api/v1/product-models/${productModelId}/components/${componentId}`)
          .then(() => undefined)
      } catch (error) {
        const message = await extractErrorMessage(error)
        throw new Error(message)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: componentKeys.lists() })
    },
  })
}
