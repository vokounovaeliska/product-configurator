"use client"

import { useEffect, useMemo, useState } from "react"
import { useQueries } from "@tanstack/react-query"
import { PencilIcon, TrashIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Tooltip } from "@workspace/ui/components/tooltip"
import { Typography } from "@workspace/ui/components/typography"

import { getAttributeOptionsListQueryOptions } from "@/api/attributeOptionQueries"
import { useAllAttributesForProductModel } from "@/api/attributeQueries"
import type { AttributeType } from "@/api/attributeTypes"
import type { AttributePricingRuleCreateDto, AttributePricingRuleDto } from "@/api/pricingTypes"
import { getImageUrlForDisplay } from "@/utils/imageUrl"

/* eslint-disable-next-line import/no-restricted-paths -- pricing needs product model for currency */
import { useProductModel } from "@/features/productModels/api/productModelQueries"

import {
  useCreatePricingRule,
  useDeletePricingRule,
  usePricingRulesList,
  useUpdatePricingRule,
} from "../api/pricingRulesQueries"
import { CreatePricingRuleDialog } from "./CreatePricingRuleDialog"
import { EditPricingRuleDialog } from "./EditPricingRuleDialog"

export type PresetAttributeContext = {
  unit?: string | null
  attributeType?: AttributeType
  numericRange?: { min: number; max: number }
}

type Props = {
  productModelId: string
  /** When set (e.g. from attribute pricing page), only rules for this attribute are shown and filter is preset. */
  presetComponentId?: string
  presetAttributeCode?: string
  /** When set (e.g. from attribute pricing page), unit/type/range are shown in Create/Edit before attribute loads. */
  presetAttributeContext?: PresetAttributeContext
}

const FILTER_OPERATOR_ALL = "all"

export const PricingRulesList = ({
  productModelId,
  presetComponentId,
  presetAttributeCode,
  presetAttributeContext,
}: Props) => {
  const t = useTranslations("Pricing")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AttributePricingRuleDto | null>(null)
  const [rowDrafts, setRowDrafts] = useState<
    Record<
      string,
      {
        conditionValue: string
        conditionToValue: string
        price: string
        operator?: "EQ" | "BETWEEN"
      }
    >
  >({})
  const [filterAttributeCode, setFilterAttributeCode] = useState(presetAttributeCode ?? "")
  const [filterOperator, setFilterOperator] = useState<string>(FILTER_OPERATOR_ALL)
  const [selectedRuleIds, setSelectedRuleIds] = useState<Set<string>>(new Set())
  const [newRowDraft, setNewRowDraft] = useState<{
    componentId: string
    attributeCode: string
    operator: "EQ" | "BETWEEN"
    conditionValue: string
    conditionToValue: string
    price: string
  } | null>(null)
  const isAttributeScoped = Boolean(presetComponentId && presetAttributeCode)

  const { data: productModel } = useProductModel(productModelId)
  const { data: allAttributes = [] } = useAllAttributesForProductModel(productModelId)

  const attributeUnitByComponentAndCode = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().trim()
    const map = new Map<string, string | null>()
    const codeOnlyMap = new Map<string, string | null>()
    allAttributes.forEach((a) => {
      const key = `${a.componentId}:${norm(a.code)}`
      if (!map.has(key)) map.set(key, a.unit?.trim() ?? null)
      const code = norm(a.code)
      if (!codeOnlyMap.has(code)) codeOnlyMap.set(code, a.unit?.trim() ?? null)
    })
    return { byKey: map, byCode: codeOnlyMap }
  }, [allAttributes])

  const attributeLabelByComponentAndCode = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().trim()
    const byKey = new Map<string, string>()
    const byCode = new Map<string, string>()
    allAttributes.forEach((a) => {
      const key = `${a.componentId}:${norm(a.code)}`
      const label = a.label?.trim() || a.code
      if (!byKey.has(key)) byKey.set(key, label)
      const code = norm(a.code)
      if (!byCode.has(code)) byCode.set(code, label)
    })
    return { byKey, byCode }
  }, [allAttributes])

  const getLabelForRule = (rule: AttributePricingRuleDto): string => {
    const code = rule.attributeCode?.toLowerCase().trim() ?? ""
    if (!code) return rule.attributeCode ?? "—"
    if (rule.componentId) {
      return (
        attributeLabelByComponentAndCode.byKey.get(`${rule.componentId}:${code}`) ??
        attributeLabelByComponentAndCode.byCode.get(code) ??
        rule.attributeCode ??
        "—"
      )
    }
    return attributeLabelByComponentAndCode.byCode.get(code) ?? rule.attributeCode ?? "—"
  }

  const getUnitForRule = (rule: AttributePricingRuleDto): string | null => {
    const code = rule.attributeCode?.toLowerCase().trim() ?? ""
    if (!code) return null
    if (rule.componentId) {
      return (
        attributeUnitByComponentAndCode.byKey.get(`${rule.componentId}:${code}`) ??
        attributeUnitByComponentAndCode.byCode.get(code) ??
        null
      )
    }
    return attributeUnitByComponentAndCode.byCode.get(code) ?? null
  }

  const currency = productModel?.currency ?? "CZK"
  const _formatPrice = (amountInMainUnit: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amountInMainUnit)

  const {
    data: rules = [],
    isLoading,
    error,
  } = usePricingRulesList({
    productModelId,
    componentId: presetComponentId,
    attributeCode: presetAttributeCode,
  })

  const enumAttributeIdsFromRules = useMemo(() => {
    const seen = new Set<string>()
    const result: { componentId: string; attributeId: string }[] = []
    for (const rule of rules) {
      if (!rule.componentId || !rule.attributeCode) continue
      const attr = allAttributes.find(
        (a) =>
          a.componentId === rule.componentId &&
          a.code?.toLowerCase().trim() === rule.attributeCode?.toLowerCase().trim() &&
          a.type === "ENUM",
      )
      if (attr && !seen.has(attr.id)) {
        seen.add(attr.id)
        result.push({ componentId: rule.componentId, attributeId: attr.id })
      }
    }
    return result
  }, [rules, allAttributes])

  const optionQueriesResults = useQueries({
    queries: enumAttributeIdsFromRules.map(({ componentId, attributeId }) =>
      getAttributeOptionsListQueryOptions(productModelId, componentId, attributeId),
    ),
  })
  const optionDataByIndex = optionQueriesResults.map((r) => r.data)

  const { optionValueToLabelByAttribute, optionValueToImageUrlByAttribute } = useMemo(() => {
    const labelMap = new Map<string, string>()
    const imageMap = new Map<string, string>()
    enumAttributeIdsFromRules.forEach(({ componentId, attributeId }, i) => {
      const opts = optionDataByIndex[i] ?? []
      const attr = allAttributes.find((a) => a.id === attributeId && a.componentId === componentId)
      const code = attr?.code?.toLowerCase().trim() ?? ""
      opts.forEach((opt) => {
        const key = `${componentId}:${code}:${(opt.value ?? "").toLowerCase()}`
        const label = (opt.label?.trim() || opt.value) ?? ""
        labelMap.set(key, label)
        if (opt.imageUrl?.trim()) {
          imageMap.set(key, getImageUrlForDisplay(opt.imageUrl))
        }
      })
    })
    return {
      optionValueToLabelByAttribute: labelMap,
      optionValueToImageUrlByAttribute: imageMap,
    }
  }, [enumAttributeIdsFromRules, optionDataByIndex, allAttributes])

  const _getOptionsForRule = (
    rule: AttributePricingRuleDto,
  ): { value: string; label: string }[] => {
    if (!rule.componentId || !rule.attributeCode) return []
    const code = rule.attributeCode.toLowerCase().trim()
    const attr = allAttributes.find(
      (a) =>
        a.componentId === rule.componentId &&
        a.code?.toLowerCase().trim() === code &&
        a.type === "ENUM",
    )
    if (!attr) return []
    const idx = enumAttributeIdsFromRules.findIndex(
      (e) => e.componentId === rule.componentId && e.attributeId === attr.id,
    )
    const opts = idx >= 0 ? (optionDataByIndex[idx] ?? []) : []
    return opts.map((o) => ({
      value: o.value ?? "",
      label: (o.label?.trim() || o.value) ?? "",
    }))
  }

  const getOptionLabelForRule = (rule: AttributePricingRuleDto, value: string): string => {
    if (!rule.componentId || !rule.attributeCode || !value) return value
    const code = rule.attributeCode.toLowerCase().trim()
    const key = `${rule.componentId}:${code}:${value.toLowerCase()}`
    return optionValueToLabelByAttribute.get(key) ?? value
  }

  const getOptionImageUrlForRule = (
    rule: AttributePricingRuleDto,
    value: string,
  ): string | null => {
    if (!rule.componentId || !rule.attributeCode || !value) return null
    const code = rule.attributeCode.toLowerCase().trim()
    const key = `${rule.componentId}:${code}:${value.toLowerCase()}`
    return optionValueToImageUrlByAttribute.get(key) ?? null
  }

  const isEnumRule = (rule: AttributePricingRuleDto): boolean =>
    Boolean(
      rule.componentId &&
      rule.attributeCode &&
      allAttributes.some(
        (a) =>
          a.componentId === rule.componentId &&
          a.code?.toLowerCase().trim() === rule.attributeCode?.toLowerCase().trim() &&
          a.type === "ENUM",
      ),
    )

  const _getConditionDisplay = (rule: AttributePricingRuleDto): string => {
    const unit = getUnitForRule(rule)
    const unitSuffix = unit ? ` ${unit}` : ""
    if (rule.operator === "EQ") {
      const displayValue = getOptionLabelForRule(rule, rule.value)
      return `${t("list.operatorEq")} "${displayValue}"${unitSuffix}`
    }
    const fromLabel = getOptionLabelForRule(rule, rule.value)
    const toLabel = rule.toValue ? getOptionLabelForRule(rule, rule.toValue) : (rule.toValue ?? "")
    return `${t("list.operatorBetween")} ${fromLabel}–${toLabel}${unitSuffix}`
  }

  const createMutation = useCreatePricingRule(productModelId)
  const updateMutation = useUpdatePricingRule(productModelId)
  const deleteMutation = useDeletePricingRule(productModelId)

  const attributeCodesWithLabels = useMemo(() => {
    const codes = [...new Set(rules.map((r) => r.attributeCode))].sort()
    return codes.map((code) => ({
      code,
      label: attributeLabelByComponentAndCode.byCode.get(code?.toLowerCase().trim() ?? "") ?? code,
    }))
  }, [rules, attributeLabelByComponentAndCode])

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      if (isAttributeScoped) {
        if (rule.componentId !== presetComponentId || rule.attributeCode !== presetAttributeCode) {
          return false
        }
      } else if (filterAttributeCode !== "" && rule.attributeCode !== filterAttributeCode) {
        return false
      }
      if (filterOperator !== FILTER_OPERATOR_ALL && rule.operator !== filterOperator) {
        return false
      }
      return true
    })
  }, [
    rules,
    filterAttributeCode,
    filterOperator,
    isAttributeScoped,
    presetComponentId,
    presetAttributeCode,
  ])

  useEffect(() => {
    const ruleIds = new Set(rules.map((r) => r.id))
    setSelectedRuleIds((prev) => {
      const next = new Set([...prev].filter((id) => ruleIds.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [rules])

  const hasFilterApplied =
    !isAttributeScoped && (filterAttributeCode !== "" || filterOperator !== FILTER_OPERATOR_ALL)

  const createPresetFromFilters = useMemo(
    () => {
      if (!hasFilterApplied) return undefined
      let componentId: string | undefined
      let attributeCode: string | undefined
      let numericUnit: string | null | undefined
      let numericRange: { min: number; max: number } | undefined
      if (filterAttributeCode) {
        const firstRule = filteredRules.find(
          (r) => r.attributeCode?.toLowerCase() === filterAttributeCode?.toLowerCase(),
        )
        if (firstRule?.componentId && firstRule?.attributeCode) {
          componentId = firstRule.componentId
          attributeCode = firstRule.attributeCode
          numericUnit = getUnitForRule(firstRule)
          const attr = allAttributes.find(
            (a) =>
              a.componentId === firstRule.componentId &&
              a.code?.toLowerCase() === firstRule.attributeCode?.toLowerCase(),
          )
          if (attr && (attr.type === "INTEGER" || attr.type === "DECIMAL")) {
            numericRange =
              attr.type === "INTEGER"
                ? { min: attr.minInt ?? 0, max: attr.maxInt ?? 100 }
                : { min: attr.minDecimal ?? 0, max: attr.maxDecimal ?? 100 }
          }
        } else {
          const attr = allAttributes.find(
            (a) => a.code?.toLowerCase().trim() === filterAttributeCode?.toLowerCase().trim(),
          )
          if (attr) {
            componentId = attr.componentId
            attributeCode = attr.code
            numericUnit = attr.unit?.trim() ?? null
            numericRange =
              attr.type === "INTEGER"
                ? { min: attr.minInt ?? 0, max: attr.maxInt ?? 100 }
                : attr.type === "DECIMAL"
                  ? { min: attr.minDecimal ?? 0, max: attr.maxDecimal ?? 100 }
                  : undefined
          }
        }
      }
      const presetOperator =
        filterOperator !== FILTER_OPERATOR_ALL ? (filterOperator as "EQ" | "BETWEEN") : undefined
      if (!componentId && !attributeCode && !presetOperator) return undefined
      return {
        componentId,
        attributeCode,
        presetNumericUnit: numericUnit,
        presetNumericRange: numericRange,
        presetOperator,
      }
    },
    // getUnitForRule is stable (depends on allAttributes which is in deps)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasFilterApplied, filterAttributeCode, filterOperator, filteredRules, allAttributes],
  )

  const canAddInlineRow = Boolean(
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- intentional boolean OR
    (isAttributeScoped && presetComponentId && presetAttributeCode) ||
    (createPresetFromFilters?.componentId &&
      createPresetFromFilters?.attributeCode &&
      hasFilterApplied),
  )

  const newRowAttribute = useMemo(() => {
    if (!newRowDraft) return null
    return allAttributes.find(
      (a) =>
        a.componentId === newRowDraft.componentId &&
        a.code?.toLowerCase().trim() === newRowDraft.attributeCode?.toLowerCase().trim(),
    )
  }, [newRowDraft, allAttributes])

  const handleAddNewRow = () => {
    const compId = isAttributeScoped ? presetComponentId : createPresetFromFilters?.componentId
    const attrCode = isAttributeScoped
      ? presetAttributeCode
      : createPresetFromFilters?.attributeCode
    if (!compId || !attrCode) {
      setIsCreateOpen(true)
      return
    }
    const attr = allAttributes.find(
      (a) =>
        a.componentId === compId && a.code?.toLowerCase().trim() === attrCode?.toLowerCase().trim(),
    )
    const isEnum = attr?.type === "ENUM"
    if (isEnum) {
      setIsCreateOpen(true)
      return
    }
    const op =
      (isAttributeScoped ? undefined : createPresetFromFilters?.presetOperator) ?? "BETWEEN"
    setNewRowDraft({
      componentId: compId,
      attributeCode: attrCode,
      operator: op,
      conditionValue: "",
      conditionToValue: "",
      price: "0",
    })
  }

  const handleSaveNewRow = () => {
    if (!newRowDraft) return
    const valueTrimmed = newRowDraft.conditionValue.trim()
    const toValueTrimmed =
      newRowDraft.operator === "BETWEEN" ? newRowDraft.conditionToValue.trim() : undefined
    const parsed = Number.parseFloat(newRowDraft.price.replace(",", "."))
    if (!valueTrimmed) return
    if (Number.isNaN(parsed)) return
    const priceCents = Math.round(parsed * 100)
    createMutation.mutate(
      {
        componentId: newRowDraft.componentId,
        attributeCode: newRowDraft.attributeCode,
        operator: newRowDraft.operator,
        value: valueTrimmed,
        toValue: newRowDraft.operator === "BETWEEN" ? (toValueTrimmed ?? undefined) : undefined,
        price: priceCents,
      },
      {
        onSuccess: () => {
          setNewRowDraft(null)
        },
      },
    )
  }

  const handleCancelNewRow = () => setNewRowDraft(null)

  const hasNewRowChanged = (): boolean => {
    if (!newRowDraft) return false
    if (!newRowDraft.conditionValue.trim()) return false
    if (newRowDraft.operator === "BETWEEN" && !newRowDraft.conditionToValue.trim()) return false
    return true
  }

  const selectedFiltered = filteredRules.filter((r) => selectedRuleIds.has(r.id))
  const isAllFilteredSelected =
    filteredRules.length > 0 && selectedFiltered.length === filteredRules.length
  const isSomeFilteredSelected = selectedFiltered.length > 0

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      setSelectedRuleIds((prev) => {
        const next = new Set(prev)
        filteredRules.forEach((r) => next.delete(r.id))
        return next
      })
    } else {
      setSelectedRuleIds((prev) => {
        const next = new Set(prev)
        filteredRules.forEach((r) => next.add(r.id))
        return next
      })
    }
  }

  const handleToggleSelectRow = (ruleId: string) => {
    setSelectedRuleIds((prev) => {
      const next = new Set(prev)
      if (next.has(ruleId)) next.delete(ruleId)
      else next.add(ruleId)
      return next
    })
  }

  const handleDeleteSelected = () => {
    const count = selectedRuleIds.size
    if (count === 0) return
    if (window.confirm(t("list.deleteSelectedConfirm", { count }))) {
      selectedRuleIds.forEach((id) => deleteMutation.mutate(id))
      setSelectedRuleIds(new Set())
    }
  }

  const handleEditSelected = () => {
    const firstId = [...selectedRuleIds][0]
    if (!firstId) return
    const rule = rules.find((r) => r.id === firstId)
    if (rule) setEditingRule(rule)
  }

  const handleDelete = (ruleId: string) => {
    if (window.confirm(t("list.deleteButton") + "?")) {
      deleteMutation.mutate(ruleId)
    }
  }

  const getDraftForRule = (rule: AttributePricingRuleDto) =>
    rowDrafts[rule.id] ?? {
      conditionValue: rule.value,
      conditionToValue: rule.toValue ?? "",
      price: (rule.price / 100).toString(),
      operator: rule.operator as "EQ" | "BETWEEN",
    }

  const hasRuleChanged = (rule: AttributePricingRuleDto): boolean => {
    const draft = getDraftForRule(rule)
    const isPriceChanged =
      Math.round(Number.parseFloat(draft.price.replace(",", ".")) * 100) !== rule.price
    if (isEnumRule(rule)) return isPriceChanged
    const effectiveOp = draft.operator ?? rule.operator
    const hasOperatorChanged = effectiveOp !== rule.operator
    const hasConditionChanged =
      draft.conditionValue.trim() !== rule.value ||
      (effectiveOp === "BETWEEN" && draft.conditionToValue.trim() !== (rule.toValue ?? ""))
    const isBetweenIncomplete = effectiveOp === "BETWEEN" && !draft.conditionToValue.trim()
    return !isBetweenIncomplete && (hasOperatorChanged || hasConditionChanged || isPriceChanged)
  }

  const setDraftForRule = (
    rule: AttributePricingRuleDto,
    patch: Partial<{
      conditionValue: string
      conditionToValue: string
      price: string
      operator: "EQ" | "BETWEEN"
    }>,
  ) => {
    setRowDrafts((prev) => {
      const current = prev[rule.id] ?? {
        conditionValue: rule.value,
        conditionToValue: rule.toValue ?? "",
        price: (rule.price / 100).toString(),
        operator: rule.operator as "EQ" | "BETWEEN",
      }
      return { ...prev, [rule.id]: { ...current, ...patch } }
    })
  }

  const handleSaveRow = (rule: AttributePricingRuleDto) => {
    const draft = getDraftForRule(rule)
    const effectiveOperator = (draft.operator ?? rule.operator) as "EQ" | "BETWEEN"
    const valueTrimmed = isEnumRule(rule) ? rule.value : draft.conditionValue.trim()
    const toValueTrimmed = isEnumRule(rule)
      ? (rule.toValue ?? undefined)
      : effectiveOperator === "BETWEEN"
        ? draft.conditionToValue.trim()
        : undefined
    const parsed = Number.parseFloat(draft.price.replace(",", "."))
    if (!valueTrimmed) return
    if (effectiveOperator === "BETWEEN" && !toValueTrimmed) return
    if (Number.isNaN(parsed)) return
    const priceCents = Math.round(parsed * 100)
    updateMutation.mutate(
      {
        ruleId: rule.id,
        body: {
          componentId: rule.componentId ?? undefined,
          attributeCode: rule.attributeCode,
          operator: effectiveOperator,
          value: valueTrimmed,
          toValue: effectiveOperator === "BETWEEN" ? (toValueTrimmed ?? undefined) : undefined,
          price: priceCents,
        },
      },
      {
        onSuccess: () => {
          setRowDrafts((prev) => {
            const next = { ...prev }
            delete next[rule.id]
            return next
          })
        },
      },
    )
  }

  if (error) {
    return (
      <Card className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <Typography
          as="p"
          variant="body-md"
          className="text-destructive"
        >
          {t("list.errorMessage")}
        </Typography>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Typography
          as="h2"
          variant="display-lg"
          weight="semibold"
        >
          {t("list.title")}
        </Typography>
        <Button onClick={() => setIsCreateOpen(true)}>{t("list.createButton")}</Button>
      </div>

      {rules.length === 0 ? (
        <Card className="rounded-lg border border-dashed p-12 text-center">
          <Typography
            as="p"
            variant="body-lg"
            className="mb-4 text-muted-foreground"
          >
            {t("list.emptyState")}
          </Typography>
          <Button
            variant="outline"
            onClick={() => setIsCreateOpen(true)}
          >
            {t("list.createButton")}
          </Button>
        </Card>
      ) : (
        <>
          {selectedRuleIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <Typography
                as="span"
                variant="body-sm"
                className="text-muted-foreground"
              >
                {t("list.selectedCount", { count: selectedRuleIds.size })}
              </Typography>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditSelected}
                disabled={selectedRuleIds.size !== 1}
              >
                {t("list.editSelected")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleDeleteSelected}
              >
                {t("list.deleteSelected")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRuleIds(new Set())}
              >
                {t("list.clearSelection")}
              </Button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {!isAttributeScoped && (
              <select
                value={filterAttributeCode}
                onChange={(e) => setFilterAttributeCode(e.target.value)}
                className="h-9 w-[180px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t("list.filterAttribute")}
              >
                <option value="">{t("list.filterAttributeAll")}</option>
                {attributeCodesWithLabels.map(({ code, label }) => (
                  <option
                    key={code}
                    value={code}
                  >
                    {label}
                  </option>
                ))}
              </select>
            )}
            <select
              value={filterOperator}
              onChange={(e) => setFilterOperator(e.target.value)}
              className="h-9 w-[180px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t("list.filterOperator")}
            >
              <option value={FILTER_OPERATOR_ALL}>{t("list.filterOperatorAll")}</option>
              <option value="EQ">{t("list.operatorEq")}</option>
              <option value="BETWEEN">{t("list.operatorBetween")}</option>
            </select>
            {hasFilterApplied && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterAttributeCode(presetAttributeCode ?? "")
                  setFilterOperator(FILTER_OPERATOR_ALL)
                }}
              >
                {t("list.clearFilters")}
              </Button>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="w-0 px-2 py-3">
                    <Checkbox
                      checked={
                        isAllFilteredSelected
                          ? true
                          : isSomeFilteredSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={handleToggleSelectAll}
                      aria-label={t("list.selectAll")}
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    {t("list.columnAttribute")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    {t("list.columnOperator")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    {t("list.columnCondition")}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-foreground">
                    {t("list.columnPrice")}
                  </th>
                  <th className="w-0 px-4 py-3 text-right font-medium text-foreground">
                    {t("list.columnActions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.length === 0 && !newRowDraft ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      {t("list.filterNoResults")}
                    </td>
                  </tr>
                ) : null}
                {filteredRules.map((rule) => (
                  <tr
                    key={rule.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="w-0 px-2 py-3">
                      <Checkbox
                        checked={selectedRuleIds.has(rule.id)}
                        onCheckedChange={() => handleToggleSelectRow(rule.id)}
                        aria-label={t("list.selectRow")}
                      />
                    </td>
                    <td className="max-w-[180px] px-4 py-3 font-medium break-words">
                      {getLabelForRule(rule)}
                    </td>
                    <td className="max-w-[100px] px-4 py-3 break-words text-muted-foreground">
                      {isEnumRule(rule) ? (
                        rule.operator === "BETWEEN" ? (
                          t("list.operatorBetween")
                        ) : (
                          t("list.operatorEq")
                        )
                      ) : (
                        <select
                          value={getDraftForRule(rule).operator ?? rule.operator}
                          onChange={(e) =>
                            setDraftForRule(rule, {
                              operator: e.target.value as "EQ" | "BETWEEN",
                            })
                          }
                          className="h-8 w-[100px] rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={t("list.filterOperator")}
                        >
                          <option value="EQ">{t("list.operatorEq")}</option>
                          <option value="BETWEEN">{t("list.operatorBetween")}</option>
                        </select>
                      )}
                    </td>
                    <td className="max-w-[200px] px-4 py-3 break-words text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-2">
                        {isEnumRule(rule) ? (
                          <div className="flex items-center gap-2">
                            {(() => {
                              const imgUrl = getOptionImageUrlForRule(rule, rule.value)
                              return imgUrl ? (
                                <div className="relative aspect-square size-8 shrink-0 overflow-hidden rounded bg-muted">
                                  <Image
                                    src={imgUrl}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                              ) : null
                            })()}
                            <span>
                              {rule.operator === "EQ"
                                ? getOptionLabelForRule(rule, rule.value)
                                : `${getOptionLabelForRule(rule, rule.value)} – ${getOptionLabelForRule(rule, rule.toValue ?? "")}`}
                            </span>
                          </div>
                        ) : (
                          (() => {
                            const draft = getDraftForRule(rule)
                            const op = draft.operator ?? rule.operator
                            const attr = allAttributes.find(
                              (a) =>
                                a.componentId === rule.componentId &&
                                a.code?.toLowerCase().trim() ===
                                  rule.attributeCode?.toLowerCase().trim(),
                            )
                            const isDecimal =
                              presetAttributeContext?.attributeType === "DECIMAL" ||
                              attr?.type === "DECIMAL"
                            const step = isDecimal ? 0.01 : 1
                            const unit = getUnitForRule(rule)
                            return (
                              <>
                                <Input
                                  type="number"
                                  step={step}
                                  value={draft.conditionValue}
                                  onChange={(e) =>
                                    setDraftForRule(rule, {
                                      conditionValue: e.target.value,
                                    })
                                  }
                                  className="h-8 w-24"
                                  aria-label={t("list.value")}
                                />
                                {unit && op !== "BETWEEN" && (
                                  <Typography
                                    as="span"
                                    variant="body-sm"
                                    className="shrink-0 text-muted-foreground"
                                  >
                                    {unit}
                                  </Typography>
                                )}
                                {op === "BETWEEN" && (
                                  <>
                                    <span className="text-muted-foreground">–</span>
                                    <Input
                                      type="number"
                                      step={step}
                                      value={draft.conditionToValue}
                                      onChange={(e) =>
                                        setDraftForRule(rule, {
                                          conditionToValue: e.target.value,
                                        })
                                      }
                                      className="h-8 w-24"
                                      aria-label={t("list.toValue")}
                                    />
                                  </>
                                )}
                                {unit && op === "BETWEEN" && (
                                  <Typography
                                    as="span"
                                    variant="body-sm"
                                    className="shrink-0 text-muted-foreground"
                                  >
                                    {unit}
                                  </Typography>
                                )}
                              </>
                            )
                          })()
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <div className="flex items-center justify-end gap-1.5">
                        <Input
                          type="number"
                          step="0.01"
                          value={getDraftForRule(rule).price}
                          onChange={(e) => setDraftForRule(rule, { price: e.target.value })}
                          className="h-8 w-24 text-right"
                          aria-label={t("create.price")}
                        />
                        <Typography
                          as="span"
                          variant="body-sm"
                          className="shrink-0 text-muted-foreground"
                        >
                          {currency}
                        </Typography>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant={hasRuleChanged(rule) ? "default" : "outline"}
                          onClick={() => handleSaveRow(rule)}
                          disabled={updateMutation.isPending || !hasRuleChanged(rule)}
                        >
                          {t("list.saveButton")}
                        </Button>
                        <Tooltip>
                          <Tooltip.Trigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => setEditingRule(rule)}
                              aria-label={t("list.editButton")}
                            >
                              <PencilIcon className="size-4" />
                            </Button>
                          </Tooltip.Trigger>
                          <Tooltip.Content>{t("list.editButtonTooltip")}</Tooltip.Content>
                        </Tooltip>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(rule.id)}
                          aria-label={t("list.deleteButton")}
                        >
                          <TrashIcon className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {newRowDraft && (
                  <tr
                    key="new"
                    className="border-b border-border bg-muted/20 last:border-b-0"
                  >
                    <td className="w-0 px-2 py-3" />
                    <td className="max-w-[180px] px-4 py-3 font-medium break-words">
                      {attributeLabelByComponentAndCode.byKey.get(
                        `${newRowDraft.componentId}:${newRowDraft.attributeCode?.toLowerCase().trim()}`,
                      ) ??
                        attributeLabelByComponentAndCode.byCode.get(
                          newRowDraft.attributeCode?.toLowerCase().trim() ?? "",
                        ) ??
                        newRowDraft.attributeCode}
                    </td>
                    <td className="max-w-[100px] px-4 py-3 break-words text-muted-foreground">
                      <select
                        value={newRowDraft.operator}
                        onChange={(e) =>
                          setNewRowDraft((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  operator: e.target.value as "EQ" | "BETWEEN",
                                }
                              : null,
                          )
                        }
                        className="h-8 w-[100px] rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={t("list.filterOperator")}
                      >
                        <option value="EQ">{t("list.operatorEq")}</option>
                        <option value="BETWEEN">{t("list.operatorBetween")}</option>
                      </select>
                    </td>
                    <td className="max-w-[200px] px-4 py-3 break-words text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-2">
                        {(() => {
                          const unit =
                            newRowAttribute?.unit?.trim() ??
                            attributeUnitByComponentAndCode.byKey.get(
                              `${newRowDraft.componentId}:${newRowDraft.attributeCode?.toLowerCase().trim()}`,
                            ) ??
                            null
                          const isDecimal =
                            presetAttributeContext?.attributeType === "DECIMAL" ||
                            newRowAttribute?.type === "DECIMAL"
                          const step = isDecimal ? 0.01 : 1
                          return (
                            <>
                              <Input
                                type="number"
                                step={step}
                                value={newRowDraft.conditionValue}
                                onChange={(e) =>
                                  setNewRowDraft((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          conditionValue: e.target.value,
                                        }
                                      : null,
                                  )
                                }
                                className="h-8 w-24"
                                aria-label={t("list.value")}
                              />
                              {unit && newRowDraft.operator !== "BETWEEN" && (
                                <Typography
                                  as="span"
                                  variant="body-sm"
                                  className="shrink-0 text-muted-foreground"
                                >
                                  {unit}
                                </Typography>
                              )}
                              {newRowDraft.operator === "BETWEEN" && (
                                <>
                                  <span className="text-muted-foreground">–</span>
                                  <Input
                                    type="number"
                                    step={step}
                                    value={newRowDraft.conditionToValue}
                                    onChange={(e) =>
                                      setNewRowDraft((prev) =>
                                        prev
                                          ? {
                                              ...prev,
                                              conditionToValue: e.target.value,
                                            }
                                          : null,
                                      )
                                    }
                                    className="h-8 w-24"
                                    aria-label={t("list.toValue")}
                                  />
                                </>
                              )}
                              {unit && newRowDraft.operator === "BETWEEN" && (
                                <Typography
                                  as="span"
                                  variant="body-sm"
                                  className="shrink-0 text-muted-foreground"
                                >
                                  {unit}
                                </Typography>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <div className="flex items-center justify-end gap-1.5">
                        <Input
                          type="number"
                          step="0.01"
                          value={newRowDraft.price}
                          onChange={(e) =>
                            setNewRowDraft((prev) =>
                              prev ? { ...prev, price: e.target.value } : null,
                            )
                          }
                          className="h-8 w-24 text-right"
                          aria-label={t("create.price")}
                        />
                        <Typography
                          as="span"
                          variant="body-sm"
                          className="shrink-0 text-muted-foreground"
                        >
                          {currency}
                        </Typography>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={handleSaveNewRow}
                          disabled={createMutation.isPending || !hasNewRowChanged()}
                        >
                          {t("list.saveButton")}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelNewRow}
                          disabled={createMutation.isPending}
                        >
                          {t("create.cancelButton")}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {(hasFilterApplied || isAttributeScoped) && !newRowDraft && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => (canAddInlineRow ? handleAddNewRow() : setIsCreateOpen(true))}
                className="gap-1.5"
              >
                <span className="size-4">+</span>
                {t("list.addWithFilter")}
              </Button>
            </div>
          )}
        </>
      )}

      <CreatePricingRuleDialog
        productModelId={productModelId}
        currency={currency}
        isOpen={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={async (body: AttributePricingRuleCreateDto) => {
          await createMutation.mutateAsync(body)
          setIsCreateOpen(false)
        }}
        isSubmitting={createMutation.isPending}
        presetComponentId={
          isAttributeScoped ? presetComponentId : createPresetFromFilters?.componentId
        }
        presetAttributeCode={
          isAttributeScoped ? presetAttributeCode : createPresetFromFilters?.attributeCode
        }
        presetNumericUnit={
          isAttributeScoped
            ? presetAttributeContext?.unit
            : createPresetFromFilters?.presetNumericUnit
        }
        presetNumericRange={
          isAttributeScoped
            ? presetAttributeContext?.numericRange
            : createPresetFromFilters?.presetNumericRange
        }
        presetOperator={createPresetFromFilters?.presetOperator}
        existingRules={rules}
      />

      {editingRule && (
        <EditPricingRuleDialog
          rule={editingRule}
          currency={currency}
          isOpen={Boolean(editingRule)}
          onOpenChange={(isOpen) => !isOpen && setEditingRule(null)}
          onSubmit={async (body) => {
            await updateMutation.mutateAsync({
              ruleId: editingRule.id,
              body,
            })
            setEditingRule(null)
          }}
          isSubmitting={updateMutation.isPending}
          fixedAttribute={
            isAttributeScoped && presetComponentId && presetAttributeCode
              ? { componentId: presetComponentId, attributeCode: presetAttributeCode }
              : editingRule.componentId && editingRule.attributeCode
                ? {
                    componentId: editingRule.componentId,
                    attributeCode: editingRule.attributeCode,
                  }
                : undefined
          }
          attributeUnit={getUnitForRule(editingRule) ?? presetAttributeContext?.unit}
          attributeContext={
            isAttributeScoped && presetAttributeContext
              ? {
                  attributeType: presetAttributeContext.attributeType ?? "INTEGER",
                  unit: presetAttributeContext.unit,
                  numericRange: presetAttributeContext.numericRange,
                }
              : undefined
          }
        />
      )}
    </div>
  )
}
