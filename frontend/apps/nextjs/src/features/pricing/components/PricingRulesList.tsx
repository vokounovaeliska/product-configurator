"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"

import { useAllAttributesForProductModel } from "@/api/attributeQueries"
import type { AttributeType } from "@/api/attributeTypes"
import type { AttributePricingRuleCreateDto, AttributePricingRuleDto } from "@/api/pricingTypes"

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

export const PricingRulesList = ({
  productModelId,
  presetComponentId,
  presetAttributeCode,
  presetAttributeContext,
}: Props) => {
  const t = useTranslations("Pricing")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AttributePricingRuleDto | null>(null)
  const [filterAttributeCode, setFilterAttributeCode] = useState(presetAttributeCode ?? "")
  const [filterOperator, setFilterOperator] = useState<string>(FILTER_OPERATOR_ALL)
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

  const getConditionDisplay = (rule: AttributePricingRuleDto): string => {
    const unit = getUnitForRule(rule)
    const unitSuffix = unit ? ` ${unit}` : ""
    if (rule.operator === "EQ") {
      return `${t("list.operatorEq")} "${rule.value}"${unitSuffix}`
    }
    return `${t("list.operatorBetween")} ${rule.value}–${rule.toValue ?? ""}${unitSuffix}`
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

  const handleDelete = (ruleId: string) => {
    if (window.confirm(t("list.deleteButton") + "?")) {
      deleteMutation.mutate(ruleId)
    }
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

          <div className="max-h-[50vh] overflow-auto rounded-lg border border-border">
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
                  filteredRules.map((rule) => (
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
                        {getConditionDisplay(rule)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatPrice(rule.priceDeltaCents / 100)}
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
