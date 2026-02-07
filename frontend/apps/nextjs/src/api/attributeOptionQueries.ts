import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  AttributeOptionCreateRequestDto,
  AttributeOptionDto,
  AttributeOptionPatchRequestDto,
} from "@/api/attributeTypes"
import { api } from "@/lib/api/restClient"
import { extractErrorMessage } from "@/lib/utils"

const basePath = (productModelId: string, componentId: string, attributeId: string) =>
  `products/api/v1/product-models/${productModelId}/components/${componentId}/attributes/${attributeId}/options`

export const attributeOptionKeys = {
  all: ["attributeOptions"] as const,
  lists: () => [...attributeOptionKeys.all, "list"] as const,
  list: (productModelId: string, componentId: string, attributeId: string) =>
    [...attributeOptionKeys.lists(), productModelId, componentId, attributeId] as const,
  details: () => [...attributeOptionKeys.all, "detail"] as const,
  detail: (productModelId: string, componentId: string, attributeId: string, optionId: string) =>
    [...attributeOptionKeys.details(), productModelId, componentId, attributeId, optionId] as const,
} as const

export const getAttributeOptionsListQueryOptions = (
  productModelId: string,
  componentId: string,
  attributeId: string,
) =>
  queryOptions({
    queryKey: attributeOptionKeys.list(productModelId, componentId, attributeId),
    queryFn: async (): Promise<AttributeOptionDto[]> => {
      const data = await api
        .get(basePath(productModelId, componentId, attributeId))
        .json<AttributeOptionDto[]>()
      return Array.isArray(data) ? data : []
    },
  })

export const getAttributeOptionQueryOptions = (
  productModelId: string,
  componentId: string,
  attributeId: string,
  optionId: string,
) =>
  queryOptions({
    queryKey: attributeOptionKeys.detail(productModelId, componentId, attributeId, optionId),
    queryFn: async (): Promise<AttributeOptionDto> => {
      return api
        .get(`${basePath(productModelId, componentId, attributeId)}/${optionId}`)
        .json<AttributeOptionDto>()
    },
  })

export const useAttributeOptionsList = (
  productModelId: string,
  componentId: string,
  attributeId: string,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    ...getAttributeOptionsListQueryOptions(productModelId, componentId, attributeId),
    enabled:
      (options?.enabled !== false &&
        Boolean(productModelId) &&
        Boolean(componentId) &&
        Boolean(attributeId)) ??
      true,
  })
}

export const useAttributeOption = (
  productModelId: string,
  componentId: string,
  attributeId: string,
  optionId: string,
  queryOptions?: { enabled?: boolean },
) => {
  return useQuery({
    ...getAttributeOptionQueryOptions(productModelId, componentId, attributeId, optionId),
    enabled:
      (queryOptions?.enabled !== false &&
        Boolean(productModelId) &&
        Boolean(componentId) &&
        Boolean(attributeId) &&
        Boolean(optionId)) ??
      true,
  })
}

export const useCreateAttributeOption = (
  productModelId: string,
  componentId: string,
  attributeId: string,
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AttributeOptionCreateRequestDto): Promise<AttributeOptionDto> => {
      try {
        return await api
          .post(basePath(productModelId, componentId, attributeId), {
            json: data,
          })
          .json<AttributeOptionDto>()
      } catch (error) {
        const message = await extractErrorMessage(error)
        throw new Error(message)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: attributeOptionKeys.list(productModelId, componentId, attributeId),
      })
    },
  })
}

export const useUpdateAttributeOption = (
  productModelId: string,
  componentId: string,
  attributeId: string,
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      optionId,
      patches,
    }: {
      optionId: string
      patches: AttributeOptionPatchRequestDto[]
    }): Promise<AttributeOptionDto> => {
      try {
        return await api
          .patch(`${basePath(productModelId, componentId, attributeId)}/${optionId}`, {
            json: patches,
            headers: {
              "content-type": "application/json-patch+json",
            },
          })
          .json<AttributeOptionDto>()
      } catch (error) {
        const message = await extractErrorMessage(error)
        throw new Error(message)
      }
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({
        queryKey: attributeOptionKeys.list(productModelId, componentId, attributeId),
      })
      void queryClient.invalidateQueries({
        queryKey: attributeOptionKeys.detail(productModelId, componentId, attributeId, data.id),
      })
    },
  })
}

export const useDeleteAttributeOption = (
  productModelId: string,
  componentId: string,
  attributeId: string,
) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (optionId: string): Promise<void> => {
      try {
        await api
          .delete(`${basePath(productModelId, componentId, attributeId)}/${optionId}`)
          .then(() => undefined)
      } catch (error) {
        const message = await extractErrorMessage(error)
        throw new Error(message)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: attributeOptionKeys.list(productModelId, componentId, attributeId),
      })
    },
  })
}
