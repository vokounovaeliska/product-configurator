/**
 * Utilities for displaying customer request configuration.
 * Formats user choices and resolved dimensions for display.
 */

import type { AttributeDto } from "@/api/attributeTypes"
import type { ComponentDto } from "@/api/componentTypes"

/* eslint-disable import/no-restricted-paths -- request display uses resolved dimensions type from parametric pipeline */
import type { ResolvedDimensions } from "@/features/configurator/utils/parametricTransformPipeline"

/* eslint-enable import/no-restricted-paths */

export type UserChoiceItem = {
  componentLabel: string
  attributeLabel: string
  displayValue: string
  unit?: string
}

export type ComponentDimensionsItem = {
  componentCode: string
  componentLabel: string
  lenx: number
  leny: number
  lenz: number
  unit: string
}

const DEFAULT_UNIT = "cm"

function formatNumericValue(value: number | boolean, unit?: string | null): string {
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (!Number.isFinite(value)) return "—"
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2)
  const u = unit?.trim()
  // Default cm when unit unknown (e.g. list preview without loaded attributes) — matches configurator / hranol dimensions.
  if (u) return `${formatted} ${u}`
  return `${formatted} ${DEFAULT_UNIT}`
}

/**
 * Extracts user choices from config, optionally with component/attribute labels.
 * When components/attributes are not provided, uses raw values (option labels, numeric values).
 */
export function extractUserChoices(
  config: Record<string, unknown> | null,
  components?: ComponentDto[],
  attributesByComponent?: Record<string, AttributeDto[]>,
): UserChoiceItem[] {
  if (!config) return []

  const hasMetadata = components && attributesByComponent
  const opts = config.selectedOptionsByComponent as
    | Record<string, Record<string, { label?: string; value?: string } | null>>
    | undefined
  const other = config.selectedOtherValuesByComponent as
    | Record<string, Record<string, number | boolean>>
    | undefined

  const items: UserChoiceItem[] = []
  const componentMap = new Map(components?.map((c) => [c.id, c]) ?? [])
  const attrsByComp = attributesByComponent ?? {}

  if (opts) {
    for (const [compId, compOpts] of Object.entries(opts)) {
      if (!compOpts || typeof compOpts !== "object") continue
      const comp = componentMap.get(compId)
      const compLabel = hasMetadata ? (comp?.label ?? comp?.code ?? compId) : compId
      const attrs = attrsByComp[compId] ?? []
      const attrMap = new Map(attrs.map((a) => [a.id, a]))

      for (const [attrId, opt] of Object.entries(compOpts)) {
        if (!opt || typeof opt !== "object") continue
        const attr = attrMap.get(attrId)
        const attrLabel = hasMetadata ? (attr?.label ?? attr?.code ?? attrId) : attrId
        const displayValue = opt.label ?? opt.value ?? "—"
        items.push({
          componentLabel: compLabel,
          attributeLabel: attrLabel,
          displayValue,
        })
      }
    }
  }

  if (other) {
    for (const [compId, compOther] of Object.entries(other)) {
      if (!compOther || typeof compOther !== "object") continue
      const comp = componentMap.get(compId)
      const compLabel = hasMetadata ? (comp?.label ?? comp?.code ?? compId) : compId
      const attrs = attrsByComp[compId] ?? []
      const attrMap = new Map(attrs.map((a) => [a.id, a]))

      for (const [attrId, val] of Object.entries(compOther)) {
        const attr = attrMap.get(attrId)
        const attrLabel = hasMetadata ? (attr?.label ?? attr?.code ?? attrId) : attrId
        const unit = attr?.unit ?? null
        items.push({
          componentLabel: compLabel,
          attributeLabel: attrLabel,
          displayValue: formatNumericValue(val, unit),
          ...(unit != null && { unit }),
        })
      }
    }
  }

  return items
}

/** Returns true if config has no options or other values. */
export function isConfigEmpty(config: Record<string, unknown> | null): boolean {
  if (!config) return true
  const opts = config.selectedOptionsByComponent as Record<string, unknown> | undefined
  const other = config.selectedOtherValuesByComponent as Record<string, unknown> | undefined
  const isOptsEmpty = !opts || Object.keys(opts).length === 0
  const isOtherEmpty = !other || Object.keys(other).length === 0
  return isOptsEmpty && isOtherEmpty
}

/** Flat list of strings for badges/tags (e.g. list view). Uses "Label: value" when meaningful. */
export function formatConfigSummary(config: Record<string, unknown> | null): string[] {
  const items = extractUserChoices(config)
  return items.map((i) => {
    const isUuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s)
    if (i.attributeLabel && !isUuid(i.attributeLabel)) {
      return `${i.attributeLabel}: ${i.displayValue}`
    }
    return i.displayValue
  })
}

/**
 * Extracts dimension items from resolved dimensions for display.
 * Maps component codes to labels when components are provided.
 */
export function extractDimensionItems(
  resolved: ResolvedDimensions,
  components?: ComponentDto[],
  unit = DEFAULT_UNIT,
): ComponentDimensionsItem[] {
  const componentByCode = new Map(components?.map((c) => [c.code, c]) ?? [])

  return Object.entries(resolved)
    .filter(([, dims]) => dims.lenx > 0 || dims.leny > 0 || dims.lenz > 0)
    .map(([compCode, dims]) => {
      const comp = componentByCode.get(compCode)
      const compLabel = comp?.label ?? comp?.code ?? compCode
      return {
        componentCode: compCode,
        componentLabel: compLabel,
        lenx: dims.lenx,
        leny: dims.leny,
        lenz: dims.lenz,
        unit,
      }
    })
}
