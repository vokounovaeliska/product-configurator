"use client"

import { useTranslations } from "next-intl"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import type { AttributeDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"

/* eslint-disable import/no-restricted-paths -- request display shows resolved dimensions from parametric pipeline */
import type { ResolvedDimensions } from "@/features/configurator/utils/parametricTransformPipeline"

import type { RequestConfigurationData } from "../hooks/useRequestConfigurationData"
import {
  extractDimensionItems,
  extractUserChoices,
  isConfigEmpty,
} from "../utils/requestConfigDisplay"

/* eslint-enable import/no-restricted-paths */

type Props = {
  config: Record<string, unknown> | null
  configStr: string
  /** When provided, shows user choices with labels and dimension calculations */
  configurationData?: RequestConfigurationData | null
  /** Fallback: components for display when configurationData not used */
  components?: ComponentDto[]
  /** Fallback: attributes by component when configurationData not used */
  attributesByComponent?: Record<string, AttributeDto[]>
  /** Resolved dimensions when computed externally */
  resolvedDimensions?: ResolvedDimensions | null
  variant?: "compact" | "full"
}

export const RequestConfigurationDisplay = ({
  config,
  configStr,
  configurationData,
  components,
  attributesByComponent,
  resolvedDimensions,
  variant = "full",
}: Props) => {
  const t = useTranslations("Setup.customerRequests")

  const isEmpty = isConfigEmpty(config)
  const userChoices =
    configurationData?.userChoices ?? extractUserChoices(config, components, attributesByComponent)
  const dimensionItems =
    configurationData?.dimensionItems ??
    (resolvedDimensions && components ? extractDimensionItems(resolvedDimensions, components) : [])

  if (isEmpty) {
    return (
      <Typography
        as="p"
        variant="body-md"
        className={cn(
          "rounded-lg border border-dashed bg-background p-4 text-muted-foreground",
          variant === "compact" && "bg-muted/20",
        )}
      >
        {t("detail.configurationEmpty")}
      </Typography>
    )
  }

  return (
    <div className="space-y-4">
      {/* User choices – grouped by component when we have labels */}
      {userChoices.length > 0 && (
        <div className="space-y-3">
          <Typography
            as="p"
            variant="body-sm"
            weight="semibold"
            className="text-muted-foreground"
          >
            {t("detail.userChoices")}
          </Typography>
          <div className="rounded-lg border bg-background p-4">
            <dl className="space-y-2">
              {userChoices.map((item, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-baseline gap-x-2 gap-y-1"
                >
                  <dt className="text-muted-foreground">
                    {item.componentLabel} · {item.attributeLabel}:
                  </dt>
                  <dd className="font-medium tabular-nums">{item.displayValue}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {/* Dimension calculations – lenx, leny, lenz per component */}
      {dimensionItems.length > 0 && (
        <div className="space-y-3">
          <Typography
            as="p"
            variant="body-sm"
            weight="semibold"
            className="text-muted-foreground"
          >
            {t("detail.dimensions")}
          </Typography>
          <div className="overflow-x-auto rounded-lg border bg-muted/20">
            <table className="w-full min-w-[320px] caption-bottom text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="h-10 px-4 py-2 text-left font-semibold">
                    {t("detail.dimensionsComponent")}
                  </th>
                  <th className="h-10 px-4 py-2 text-right font-semibold tabular-nums">LenX</th>
                  <th className="h-10 px-4 py-2 text-right font-semibold tabular-nums">LenY</th>
                  <th className="h-10 px-4 py-2 text-right font-semibold tabular-nums">LenZ</th>
                </tr>
              </thead>
              <tbody>
                {dimensionItems.map((item) => (
                  <tr
                    key={item.componentCode}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-2 font-medium">{item.componentLabel}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {item.lenx.toFixed(1)} {item.unit}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {item.leny.toFixed(1)} {item.unit}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {item.lenz.toFixed(1)} {item.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Raw JSON (collapsible) */}
      <details className="group">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
          {t("detail.rawJson")}
        </summary>
        <pre
          className={cn(
            "mt-2 overflow-auto rounded-lg border bg-background p-3 text-xs",
            variant === "full" ? "max-h-48" : "max-h-32",
          )}
        >
          {configStr}
        </pre>
      </details>
    </div>
  )
}
