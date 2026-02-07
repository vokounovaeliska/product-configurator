import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  ImageLayerCreateRequestDto,
  ImageLayerDto,
  ImageLayerPatchRequestDto,
} from "@/api/imageLayerTypes"
import { api } from "@/lib/api/restClient"
import { extractErrorMessage } from "@/lib/utils"

/**
 * Query key factory for image layer queries
 */
export const imageLayerKeys = {
  all: ["imageLayers"] as const,
  lists: () => [...imageLayerKeys.all, "list"] as const,
  list: (productModelId: string, componentId: string) =>
    [...imageLayerKeys.lists(), productModelId, componentId] as const,
  matching: (
    productModelId: string,
    componentId: string,
    attributeValues: Record<string, string>,
  ) =>
    [...imageLayerKeys.lists(), productModelId, componentId, "matching", attributeValues] as const,
  details: () => [...imageLayerKeys.all, "detail"] as const,
  detail: (productModelId: string, componentId: string, layerId: string) =>
    [...imageLayerKeys.details(), productModelId, componentId, layerId] as const,
} as const

const basePath = (productModelId: string, componentId: string) =>
  `products/api/v1/product-models/${productModelId}/components/${componentId}/image-layers`

/**
 * Query options for listing image layers (optionally filtered by attribute values)
 */
export const getImageLayersListQueryOptions = (
  productModelId: string,
  componentId: string,
  options?: {
    attributeId?: string[]
    attributeValue?: string[]
  },
) =>
  queryOptions({
    queryKey: [
      ...imageLayerKeys.list(productModelId, componentId),
      options?.attributeId?.length ?? 0,
      options?.attributeValue?.length ?? 0,
    ] as const,
    queryFn: async (): Promise<ImageLayerDto[]> => {
      const searchParams = new URLSearchParams()
      if (options?.attributeId?.length && options?.attributeValue?.length) {
        options.attributeId.forEach((id) => searchParams.append("attributeId", id))
        options.attributeValue.forEach((v) => searchParams.append("attributeValue", v))
      }
      const queryString = searchParams.toString()
      const url = `${basePath(productModelId, componentId)}${queryString ? `?${queryString}` : ""}`
      const data = await api.get(url).json<ImageLayerDto[]>()
      // Normalize conditions: backend may return raw JSON array
      return (Array.isArray(data) ? data : []).map((layer) => ({
        ...layer,
        conditions: Array.isArray(layer.conditions) ? layer.conditions : [],
      }))
    },
  })

/**
 * Query options for fetching a single image layer
 */
export const getImageLayerQueryOptions = (
  productModelId: string,
  componentId: string,
  layerId: string,
) =>
  queryOptions({
    queryKey: imageLayerKeys.detail(productModelId, componentId, layerId),
    queryFn: async (): Promise<ImageLayerDto> => {
      const layer = await api
        .get(`${basePath(productModelId, componentId)}/${layerId}`)
        .json<ImageLayerDto>()
      return {
        ...layer,
        conditions: Array.isArray(layer.conditions) ? layer.conditions : [],
      }
    },
  })

/**
 * Hook to fetch image layers for a component (all or matching)
 */
export const useImageLayersList = (
  productModelId: string,
  componentId: string,
  options?: {
    attributeId?: string[]
    attributeValue?: string[]
    enabled?: boolean
  },
) => {
  return useQuery({
    ...getImageLayersListQueryOptions(productModelId, componentId, {
      attributeId: options?.attributeId,
      attributeValue: options?.attributeValue,
    }),
    enabled:
      (options?.enabled !== false && Boolean(productModelId) && Boolean(componentId)) ?? true,
  })
}

/**
 * Hook to fetch a single image layer
 */
export const useImageLayer = (
  productModelId: string,
  componentId: string,
  layerId: string,
  queryOptions?: { enabled?: boolean },
) => {
  return useQuery({
    ...getImageLayerQueryOptions(productModelId, componentId, layerId),
    enabled:
      (queryOptions?.enabled !== false &&
        Boolean(productModelId) &&
        Boolean(componentId) &&
        Boolean(layerId)) ??
      true,
  })
}

/**
 * Hook to create an image layer
 */
export const useCreateImageLayer = (productModelId: string, componentId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ImageLayerCreateRequestDto): Promise<ImageLayerDto> => {
      try {
        return await api
          .post(basePath(productModelId, componentId), {
            json: data,
          })
          .json<ImageLayerDto>()
      } catch (error) {
        const message = await extractErrorMessage(error)
        throw new Error(message)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: imageLayerKeys.list(productModelId, componentId),
      })
    },
  })
}

/**
 * Hook to update an image layer (PATCH)
 */
export const useUpdateImageLayer = (productModelId: string, componentId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      layerId,
      patches,
    }: {
      layerId: string
      patches: ImageLayerPatchRequestDto[]
    }): Promise<ImageLayerDto> => {
      try {
        return await api
          .patch(`${basePath(productModelId, componentId)}/${layerId}`, {
            json: patches,
            headers: {
              "content-type": "application/json-patch+json",
            },
          })
          .json<ImageLayerDto>()
      } catch (error) {
        const message = await extractErrorMessage(error)
        throw new Error(message)
      }
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: imageLayerKeys.list(productModelId, componentId),
      })
      void queryClient.invalidateQueries({
        queryKey: imageLayerKeys.detail(productModelId, componentId, data.id),
      })
    },
  })
}

/**
 * Hook to delete an image layer
 */
export const useDeleteImageLayer = (productModelId: string, componentId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (layerId: string): Promise<void> => {
      try {
        await api
          .delete(`${basePath(productModelId, componentId)}/${layerId}`)
          .then(() => undefined)
      } catch (error) {
        const message = await extractErrorMessage(error)
        throw new Error(message)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: imageLayerKeys.list(productModelId, componentId),
      })
    },
  })
}
