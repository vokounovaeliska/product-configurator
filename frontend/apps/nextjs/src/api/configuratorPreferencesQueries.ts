import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  ConfiguratorPreferencesDto,
  ConfiguratorPreferencesPatchDto,
} from "@/api/configuratorPreferencesTypes"
import { api } from "@/lib/api/restClient"

export const configuratorPreferencesKeys = {
  all: ["configurator-preferences"] as const,
  detail: (productModelId: string) => [...configuratorPreferencesKeys.all, productModelId] as const,
}

export const getConfiguratorPreferencesQueryOptions = (
  productModelId: string,
  options?: { enabled?: boolean },
) =>
  ({
    queryKey: configuratorPreferencesKeys.detail(productModelId),
    queryFn: async (): Promise<ConfiguratorPreferencesDto> =>
      api
        .get(`products/api/v1/product-models/${productModelId}/configurator-preferences`)
        .json<ConfiguratorPreferencesDto>(),
    enabled: options?.enabled !== false && Boolean(productModelId),
  }) as const

export const useConfiguratorPreferences = (
  productModelId: string,
  queryOptions?: { enabled?: boolean },
) => useQuery(getConfiguratorPreferencesQueryOptions(productModelId, queryOptions))

export const usePatchConfiguratorPreferences = (productModelId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (patch: ConfiguratorPreferencesPatchDto) =>
      api
        .patch(`products/api/v1/product-models/${productModelId}/configurator-preferences`, {
          json: patch,
        })
        .json<ConfiguratorPreferencesDto>(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: configuratorPreferencesKeys.detail(productModelId),
      })
    },
  })
}
