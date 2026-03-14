"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useQueries } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"

import { getAttributeOptionsListQueryOptions } from "@/api/attributeOptionQueries"
import { useAllAttributesForProductModel } from "@/api/attributeQueries"
import type { AttributeType } from "@/api/attributeTypes"
import type { AttributePricingRuleCreateDto, AttributePricingRuleDto } from "@/api/pricingTypes"
import { getImageUrlForDisplay } from "@/utils/imageUrl"

/* eslint-disable-next-line import/no-restricted-paths -- pricing needs components and product model */
import { useComponentsList } from "@/features/components/api/componentQueries"
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
const PAGE_SIZE = 15

export const PricingRulesList = ({
  productModelId,
  presetComponentId,
  presetAttributeCode,
  presetAttributeContext,
}: Props) => {
  const t = useTranslations("Pricing")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AttributePricingRuleDto | null>(null)
  const [editingPriceRuleId, setEditingPriceRuleId] = useState<string | null>(null)
  const [editingPriceInput, setEditingPriceInput] = useState("")
  const priceInputRef = useRef<HTMLInputElement>(null)
  const [filterAttributeCode, setFilterAttributeCode] = useState(presetAttributeCode ?? "")
  const [filterOperator, setFilterOperator] = useState<string>(FILTER_OPERATOR_ALL)
  const [currentPage, setCurrentPage] = useState(1)
  const isAttributeScoped = Boolean(presetComponentId && presetAttributeCode)

  const { data: productModel } = useProductModel(productModelId)
  const { data: componentsData } = useComponentsList(productModelId, { limit: 100 })
  const components = useMemo(() => componentsData?.items ?? [], [componentsData?.items])
  const componentById = useMemo(
    () => Object.fromEntries(components.map((c) => [c.id, c])),
    [components],
  )

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
  const formatPrice = (amountInMainUnit: number) =>
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

  const getConditionDisplay = (rule: AttributePricingRuleDto): string => {
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

  const totalPages = Math.max(1, Math.ceil(filteredRules.length / PAGE_SIZE))
  const paginatedRules = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredRules.slice(start, start + PAGE_SIZE)
  }, [filteredRules, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [filterAttributeCode, filterOperator])

  const handleDelete = (ruleId: string) => {
    if (window.confirm(t("list.deleteButton") + "?")) {
      deleteMutation.mutate(ruleId)
    }
  }

  const handleStartInlinePriceEdit = (rule: AttributePricingRuleDto) => {
    setEditingPriceRuleId(rule.id)
    setEditingPriceInput((rule.price / 100).toString())
    setTimeout(() => priceInputRef.current?.focus(), 0)
  }

  const handleSaveInlinePrice = (rule: AttributePricingRuleDto) => {
    const parsed = Number.parseFloat(editingPriceInput.replace(",", "."))
    if (!Number.isNaN(parsed) && parsed >= 0) {
      const priceCents = Math.round(parsed * 100)
      updateMutation.mutate(
        {
          ruleId: rule.id,
          body: {
            componentId: rule.componentId ?? undefined,
            attributeCode: rule.attributeCode,
            operator: rule.operator,
            value: rule.value,
            toValue: rule.toValue ?? undefined,
            price: priceCents,
          },
        },
        { onSettled: () => setEditingPriceRuleId(null) },
      )
    } else {
      setEditingPriceRuleId(null)
    }
  }

  const handleCancelInlinePrice = () => {
    setEditingPriceRuleId(null)
    setEditingPriceInput("")
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
          </div>

          <div className="rounded-lg border border-border">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    {t("list.columnAttribute")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-foreground">
                    {t("list.columnComponent")}
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
                {filteredRules.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      {t("list.filterNoResults")}
                    </td>
                  </tr>
                ) : (
                  paginatedRules.map((rule) => (
                    <tr
                      key={rule.id}
                      className="border-b border-border last:border-b-0 hover:bg-muted/30"
                    >
                      <td className="max-w-[180px] px-4 py-3 font-medium break-words">
                        {getLabelForRule(rule)}
                      </td>
                      <td className="max-w-[180px] px-4 py-3 break-words text-muted-foreground">
                        {rule.componentId
                          ? (componentById[rule.componentId]?.label ?? rule.componentId)
                          : "—"}
                      </td>
                      <td className="max-w-[200px] px-4 py-3 break-words text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {isEnumRule(rule) &&
                            (() => {
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
                          <span>{getConditionDisplay(rule)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {editingPriceRuleId === rule.id ? (
                          <Input
                            ref={priceInputRef}
                            type="number"
                            step="0.01"
                            min="0"
                            value={editingPriceInput}
                            onChange={(e) => setEditingPriceInput(e.target.value)}
                            onBlur={() => handleSaveInlinePrice(rule)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                handleSaveInlinePrice(rule)
                              } else if (e.key === "Escape") {
                                handleCancelInlinePrice()
                              }
                            }}
                            className="h-8 w-24 text-right"
                            aria-label={t("create.price")}
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartInlinePriceEdit(rule)}
                            className="rounded px-2 py-1.5 text-right hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                          >
                            {formatPrice(rule.price / 100)}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingRule(rule)}
                          >
                            {t("list.editButton")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(rule.id)}
                          >
                            {t("list.deleteButton")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredRules.length > PAGE_SIZE && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Typography
                as="span"
                variant="body-sm"
                className="text-muted-foreground"
              >
                {t("list.paginationInfo", {
                  from: (currentPage - 1) * PAGE_SIZE + 1,
                  to: Math.min(currentPage * PAGE_SIZE, filteredRules.length),
                  total: filteredRules.length,
                })}
              </Typography>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  {t("list.paginationPrev")}
                </Button>
                <Typography
                  as="span"
                  variant="body-sm"
                  className="min-w-[4rem] text-center text-muted-foreground"
                >
                  {t("list.paginationPage", { current: currentPage, total: totalPages })}
                </Typography>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  {t("list.paginationNext")}
                </Button>
              </div>
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
        presetComponentId={isAttributeScoped ? presetComponentId : undefined}
        presetAttributeCode={isAttributeScoped ? presetAttributeCode : undefined}
        presetNumericUnit={isAttributeScoped ? presetAttributeContext?.unit : undefined}
        presetNumericRange={isAttributeScoped ? presetAttributeContext?.numericRange : undefined}
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
