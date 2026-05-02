"use client"

import { useEffect, useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Card } from "@workspace/ui/components/card"
import { Select } from "@workspace/ui/components/select"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import type { ProductModelDto } from "@/api/productModelTypes"

import {
  CONFIGURATOR_ANALYTICS_TIME_PRESETS,
  useConfiguratorAnalyticsSummary,
  type ConfiguratorAnalyticsTimePreset,
} from "@/features/analytics/api/configuratorAnalyticsQueries"

type Props = {
  models: ProductModelDto[]
  /** Pre-select this model (e.g. on the product Publish tab). */
  initialProductModelId?: string
}

export const ConfiguratorAnalyticsDashboard = ({ models, initialProductModelId }: Props) => {
  const locale = useLocale()
  const t = useTranslations("Setup.analytics")
  const formatCount = useMemo(
    () => (n: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(n),
    [locale],
  )
  const [timePreset, setTimePreset] = useState<ConfiguratorAnalyticsTimePreset>("LAST_7_DAYS")
  const [selectedModelId, setSelectedModelId] = useState<string>(() => {
    const id = initialProductModelId?.trim()
    return id && id.length > 0 ? id : ""
  })

  useEffect(() => {
    const id = initialProductModelId?.trim()
    if (id && id.length > 0) {
      setSelectedModelId(id)
    }
  }, [initialProductModelId])

  const productModelIdForQuery = selectedModelId.trim() !== "" ? selectedModelId : null

  const { data, isLoading, error } = useConfiguratorAnalyticsSummary({
    timePreset,
    productModelId: productModelIdForQuery,
  })

  const modelOptions = useMemo(
    () => [...models].sort((a, b) => a.name.localeCompare(b.name, locale)),
    [models, locale],
  )

  const headline = data?.headline ?? null
  const tableRows = data?.byProductModel ?? []

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-[180px] space-y-2">
          <Typography
            as="p"
            variant="body-sm"
            className="text-muted-foreground"
          >
            {t("timeRange")}
          </Typography>
          <Select
            value={timePreset}
            onValueChange={(v) => setTimePreset(v as ConfiguratorAnalyticsTimePreset)}
          >
            <Select.Trigger className="w-full sm:w-[220px]">
              <Select.Trigger.Value />
            </Select.Trigger>
            <Select.Content>
              {CONFIGURATOR_ANALYTICS_TIME_PRESETS.map((preset) => (
                <Select.Content.Item
                  key={preset}
                  value={preset}
                >
                  {t(`preset.${preset}`)}
                </Select.Content.Item>
              ))}
            </Select.Content>
          </Select>
        </div>

        <div className="min-w-[200px] flex-1 space-y-2 sm:max-w-md">
          <Typography
            as="p"
            variant="body-sm"
            className="text-muted-foreground"
          >
            {t("productModel")}
          </Typography>
          <Select
            value={selectedModelId || "__all__"}
            onValueChange={(v) => setSelectedModelId(v === "__all__" ? "" : v)}
          >
            <Select.Trigger className="w-full">
              <Select.Trigger.Value placeholder={t("allModels")} />
            </Select.Trigger>
            <Select.Content>
              <Select.Content.Item value="__all__">{t("allModels")}</Select.Content.Item>
              {modelOptions.map((m) => (
                <Select.Content.Item
                  key={m.id}
                  value={m.id}
                >
                  {m.name}
                </Select.Content.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <Typography
            as="p"
            variant="body-sm"
            className="text-destructive"
          >
            {error instanceof Error ? error.message : t("loadError")}
          </Typography>
        </div>
      )}

      {isLoading && !data && (
        <Typography
          as="p"
          variant="body-sm"
          className="text-muted-foreground"
        >
          {t("loading")}
        </Typography>
      )}

      {headline && selectedModelId && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="p-4 shadow-sm">
            <Typography
              as="p"
              variant="body-sm"
              className="text-muted-foreground"
            >
              {t("metrics.opens")}
            </Typography>
            <Typography
              as="p"
              variant="display-lg"
              weight="semibold"
            >
              {formatCount(headline.configuratorOpens)}
            </Typography>
          </Card>
          <Card className="p-4 shadow-sm">
            <Typography
              as="p"
              variant="body-sm"
              className="text-muted-foreground"
            >
              {t("metrics.changed")}
            </Typography>
            <Typography
              as="p"
              variant="display-lg"
              weight="semibold"
            >
              {formatCount(headline.changedAtLeastOnce)}
            </Typography>
          </Card>
          <Card className="p-4 shadow-sm">
            <Typography
              as="p"
              variant="body-sm"
              className="text-muted-foreground"
            >
              {t("metrics.formOpens")}
            </Typography>
            <Typography
              as="p"
              variant="display-lg"
              weight="semibold"
            >
              {formatCount(headline.requestFormOpens)}
            </Typography>
          </Card>
          <Card className="p-4 shadow-sm">
            <Typography
              as="p"
              variant="body-sm"
              className="text-muted-foreground"
            >
              {t("metrics.submissions")}
            </Typography>
            <Typography
              as="p"
              variant="display-lg"
              weight="semibold"
            >
              {formatCount(headline.submissions)}
            </Typography>
          </Card>
        </div>
      )}

      {!selectedModelId && tableRows.length > 0 && (
        <div className="min-w-0 space-y-3">
          <Typography
            as="h2"
            variant="display-sm"
            weight="semibold"
          >
            {t("allModelsTableTitle")}
          </Typography>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-3 py-2.5 text-left font-medium">{t("table.product")}</th>
                  <th className="px-3 py-2.5 text-right font-medium tabular-nums">
                    {t("table.opens")}
                  </th>
                  <th className="px-3 py-2.5 text-right font-medium tabular-nums">
                    {t("table.changed")}
                  </th>
                  <th className="px-3 py-2.5 text-right font-medium tabular-nums">
                    {t("table.formOpens")}
                  </th>
                  <th className="px-3 py-2.5 text-right font-medium tabular-nums">
                    {t("table.submissions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr
                    key={row.productModelId}
                    className={cn("border-b last:border-0", i % 2 === 1 && "bg-muted/20")}
                  >
                    <td className="px-3 py-2.5 font-medium">{row.productModelName}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {formatCount(row.configuratorOpens)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {formatCount(row.changedAtLeastOnce)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {formatCount(row.requestFormOpens)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {formatCount(row.submissions)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!selectedModelId && !isLoading && tableRows.length === 0 && (
        <Typography
          as="p"
          variant="body-sm"
          className="text-muted-foreground"
        >
          {t("emptyTable")}
        </Typography>
      )}
    </div>
  )
}
