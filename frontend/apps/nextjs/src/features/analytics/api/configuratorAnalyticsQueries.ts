import { queryOptions, useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api/restClient"
import { extractErrorMessage } from "@/lib/utils"

export const CONFIGURATOR_ANALYTICS_TIME_PRESETS = [
  "LAST_24_HOURS",
  "LAST_7_DAYS",
  "LAST_30_DAYS",
  "LAST_365_DAYS",
  "ALL_TIME",
] as const

export type ConfiguratorAnalyticsTimePreset = (typeof CONFIGURATOR_ANALYTICS_TIME_PRESETS)[number]

export type ConfiguratorAnalyticsHeadlineDto = {
  configuratorOpens: number
  changedAtLeastOnce: number
  requestFormOpens: number
  submissions: number
}

export type ConfiguratorAnalyticsPerModelRowDto = ConfiguratorAnalyticsHeadlineDto & {
  productModelId: string
  productModelName: string
}

export type ConfiguratorAnalyticsSummaryResponseDto = {
  headline: ConfiguratorAnalyticsHeadlineDto | null
  byProductModel: ConfiguratorAnalyticsPerModelRowDto[]
}

export const configuratorAnalyticsKeys = {
  all: ["configurator-analytics"] as const,
  summary: (timePreset: string, productModelId: string | null) =>
    [...configuratorAnalyticsKeys.all, "summary", timePreset, productModelId ?? "all"] as const,
}

export function getConfiguratorAnalyticsSummaryQueryOptions(args: {
  timePreset: ConfiguratorAnalyticsTimePreset
  productModelId: string | null
}) {
  const { timePreset, productModelId } = args
  return queryOptions({
    queryKey: configuratorAnalyticsKeys.summary(timePreset, productModelId),
    queryFn: async (): Promise<ConfiguratorAnalyticsSummaryResponseDto> => {
      try {
        const sp = new URLSearchParams({ timePreset })
        if (productModelId) {
          sp.set("productModelId", productModelId)
        }
        return await api
          .get(`products/api/v1/configurator-analytics/summary?${sp.toString()}`)
          .json<ConfiguratorAnalyticsSummaryResponseDto>()
      } catch (error) {
        const message = await extractErrorMessage(error)
        throw new Error(message)
      }
    },
  })
}

export function useConfiguratorAnalyticsSummary(args: {
  timePreset: ConfiguratorAnalyticsTimePreset
  productModelId: string | null
}) {
  return useQuery(getConfiguratorAnalyticsSummaryQueryOptions(args))
}
