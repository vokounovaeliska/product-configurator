"use client"

import { useEffect, useState } from "react"
import { BanknoteIcon, InfoIcon, TrashIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Select } from "@workspace/ui/components/select"
import { Tooltip } from "@workspace/ui/components/tooltip"

import type { AttributeDto, AttributePatchRequestDto, AttributeType } from "@/api/attributeTypes"
import { Link } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

import { useUpdateAttribute } from "../api/attributeQueries"

type RowEditState = {
  code: string
  label: string
  isRequired: boolean
  type: AttributeType
  sortOrder: number
  minInt: number | null
  maxInt: number | null
  minDecimal: number | null
  maxDecimal: number | null
  defaultInt: number | null
  defaultDecimal: number | null
  unit: string | null
}

const attributeToRowState = (a: AttributeDto): RowEditState => ({
  code: a.code,
  label: a.label,
  isRequired: a.isRequired ?? true,
  type: a.type,
  sortOrder: a.sortOrder,
  minInt: a.minInt,
  maxInt: a.maxInt,
  minDecimal: a.minDecimal,
  maxDecimal: a.maxDecimal,
  defaultInt: a.defaultInt ?? null,
  defaultDecimal: a.defaultDecimal ?? null,
  unit: a.unit ?? null,
})

const buildPatches = (
  original: AttributeDto,
  current: RowEditState,
): AttributePatchRequestDto[] => {
  const patches: AttributePatchRequestDto[] = []
  if (current.code !== original.code) {
    patches.push({ path: "/code", value: current.code, op: "Replace" })
  }
  if (current.label !== original.label) {
    patches.push({ path: "/label", value: current.label, op: "Replace" })
  }
  if (current.isRequired !== original.isRequired) {
    patches.push({ path: "/isRequired", value: current.isRequired, op: "Replace" })
  }
  if (current.type !== original.type) {
    patches.push({ path: "/type", value: current.type, op: "Replace" })
    if (current.type === "INTEGER") {
      patches.push({ path: "/minDecimal", value: null, op: "Replace" })
      patches.push({ path: "/maxDecimal", value: null, op: "Replace" })
      patches.push({ path: "/defaultDecimal", value: null, op: "Replace" })
    } else if (current.type === "DECIMAL") {
      patches.push({ path: "/minInt", value: null, op: "Replace" })
      patches.push({ path: "/maxInt", value: null, op: "Replace" })
      patches.push({ path: "/defaultInt", value: null, op: "Replace" })
    } else {
      patches.push({ path: "/minInt", value: null, op: "Replace" })
      patches.push({ path: "/maxInt", value: null, op: "Replace" })
      patches.push({ path: "/minDecimal", value: null, op: "Replace" })
      patches.push({ path: "/maxDecimal", value: null, op: "Replace" })
      patches.push({ path: "/defaultInt", value: null, op: "Replace" })
      patches.push({ path: "/defaultDecimal", value: null, op: "Replace" })
      patches.push({ path: "/unit", value: null, op: "Replace" })
    }
  }
  if (current.sortOrder !== original.sortOrder) {
    patches.push({ path: "/sortOrder", value: current.sortOrder, op: "Replace" })
  }
  if (current.type === "INTEGER") {
    if (current.minInt !== original.minInt) {
      patches.push({ path: "/minInt", value: current.minInt, op: "Replace" })
    }
    if (current.maxInt !== original.maxInt) {
      patches.push({ path: "/maxInt", value: current.maxInt, op: "Replace" })
    }
    if (current.defaultInt !== (original.defaultInt ?? null)) {
      patches.push({ path: "/defaultInt", value: current.defaultInt, op: "Replace" })
    }
  }
  if (current.type === "DECIMAL") {
    if (current.minDecimal !== original.minDecimal) {
      patches.push({ path: "/minDecimal", value: current.minDecimal, op: "Replace" })
    }
    if (current.maxDecimal !== original.maxDecimal) {
      patches.push({ path: "/maxDecimal", value: current.maxDecimal, op: "Replace" })
    }
    if (current.defaultDecimal !== (original.defaultDecimal ?? null)) {
      patches.push({ path: "/defaultDecimal", value: current.defaultDecimal, op: "Replace" })
    }
  }
  if (current.type === "INTEGER" || current.type === "DECIMAL") {
    const newUnit = current.unit?.trim() ?? null
    if (newUnit !== (original.unit ?? null)) {
      patches.push({ path: "/unit", value: newUnit, op: "Replace" })
    }
  }
  return patches
}

type Props = {
  attribute: AttributeDto
  productModelId: string
  componentId: string
  onDelete: () => void
}

export const AttributeInlineForm = ({
  attribute,
  productModelId,
  componentId,
  onDelete,
}: Props) => {
  const t = useTranslations("Attributes")
  const [state, setState] = useState<RowEditState>(() => attributeToRowState(attribute))
  const updateAttribute = useUpdateAttribute(productModelId, componentId)

  useEffect(() => {
    setState(attributeToRowState(attribute))
  }, [attribute])

  const isNumeric = state.type === "INTEGER" || state.type === "DECIMAL"
  const isInteger = state.type === "INTEGER"
  const isSaving =
    updateAttribute.isPending && updateAttribute.variables?.attributeId === attribute.id
  const hasChanges = JSON.stringify(attributeToRowState(attribute)) !== JSON.stringify(state)

  const handleSave = () => {
    const patches = buildPatches(attribute, state)
    if (patches.length > 0) {
      updateAttribute.mutate({ attributeId: attribute.id, patches })
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="attr-label">{t("list.columnLabel")}</Label>
          <Input
            id="attr-label"
            value={state.label}
            onChange={(e) => setState((p) => ({ ...p, label: e.target.value }))}
            placeholder={t("create.labelPlaceholder")}
            className="h-8"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label
              htmlFor="attr-code"
              className="text-xs font-normal text-muted-foreground"
            >
              {t("list.columnCode")}
            </Label>
            <Tooltip>
              <Tooltip.Trigger asChild>
                <span className="cursor-help text-muted-foreground hover:text-foreground">
                  <InfoIcon className="size-3.5" />
                </span>
              </Tooltip.Trigger>
              <Tooltip.Content
                side="top"
                className="max-w-sm"
              >
                {t("create.codeTooltip")}
              </Tooltip.Content>
            </Tooltip>
          </div>
          <Input
            id="attr-code"
            value={state.code}
            onChange={(e) => setState((p) => ({ ...p, code: e.target.value }))}
            placeholder={t("create.codePlaceholder")}
            className="h-8 font-mono text-sm"
          />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="attr-required"
              checked={state.isRequired}
              onCheckedChange={(checked) =>
                setState((p) => ({ ...p, isRequired: checked === true }))
              }
            />
            <Label
              htmlFor="attr-required"
              className="cursor-pointer text-sm font-normal"
            >
              {t("create.isRequired")}
            </Label>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="attr-type">{t("list.columnType")}</Label>
          <Select
            value={state.type}
            onValueChange={(v) => {
              setState((p) => {
                const next = { ...p, type: v as AttributeType }
                if (v === "INTEGER") {
                  next.minDecimal = null
                  next.maxDecimal = null
                  next.defaultDecimal = null
                } else if (v === "DECIMAL") {
                  next.minInt = null
                  next.maxInt = null
                  next.defaultInt = null
                } else {
                  next.minInt = null
                  next.maxInt = null
                  next.minDecimal = null
                  next.maxDecimal = null
                  next.defaultInt = null
                  next.defaultDecimal = null
                  next.unit = null
                }
                return next
              })
            }}
          >
            <Select.Trigger
              id="attr-type"
              className="h-8"
            >
              <Select.Trigger.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Content.Item value="ENUM">{t("create.typeEnum")}</Select.Content.Item>
              <Select.Content.Item value="INTEGER">{t("create.typeInteger")}</Select.Content.Item>
              <Select.Content.Item value="DECIMAL">{t("create.typeDecimal")}</Select.Content.Item>
              <Select.Content.Item value="BOOLEAN">{t("create.typeBoolean")}</Select.Content.Item>
            </Select.Content>
          </Select>
        </div>
        {isNumeric && (
          <>
            <div className="space-y-2">
              <Label>{t("list.columnRange")}</Label>
              <div className="flex items-center gap-2">
                {isInteger ? (
                  <>
                    <Input
                      type="number"
                      value={state.minInt ?? ""}
                      onChange={(e) => {
                        const v = e.target.value
                        setState((p) => ({
                          ...p,
                          minInt: v === "" ? null : Number.parseInt(v, 10) || null,
                        }))
                      }}
                      placeholder="min"
                      className="h-8 w-20"
                    />
                    <span className="text-muted-foreground">–</span>
                    <Input
                      type="number"
                      value={state.maxInt ?? ""}
                      onChange={(e) => {
                        const v = e.target.value
                        setState((p) => ({
                          ...p,
                          maxInt: v === "" ? null : Number.parseInt(v, 10) || null,
                        }))
                      }}
                      placeholder="max"
                      className="h-8 w-20"
                    />
                  </>
                ) : (
                  <>
                    <Input
                      type="number"
                      step="0.01"
                      value={state.minDecimal ?? ""}
                      onChange={(e) => {
                        const v = e.target.value
                        setState((p) => ({
                          ...p,
                          minDecimal: v === "" ? null : Number.parseFloat(v) || null,
                        }))
                      }}
                      placeholder="min"
                      className="h-8 w-20"
                    />
                    <span className="text-muted-foreground">–</span>
                    <Input
                      type="number"
                      step="0.01"
                      value={state.maxDecimal ?? ""}
                      onChange={(e) => {
                        const v = e.target.value
                        setState((p) => ({
                          ...p,
                          maxDecimal: v === "" ? null : Number.parseFloat(v) || null,
                        }))
                      }}
                      placeholder="max"
                      className="h-8 w-20"
                    />
                  </>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("list.columnDefault")}</Label>
              {isInteger ? (
                <Input
                  type="number"
                  value={state.defaultInt ?? ""}
                  onChange={(e) => {
                    const v = e.target.value
                    setState((p) => ({
                      ...p,
                      defaultInt: v === "" ? null : Number.parseInt(v, 10) || null,
                    }))
                  }}
                  placeholder="—"
                  className="h-8 w-24"
                />
              ) : (
                <Input
                  type="number"
                  step="0.01"
                  value={state.defaultDecimal ?? ""}
                  onChange={(e) => {
                    const v = e.target.value
                    setState((p) => ({
                      ...p,
                      defaultDecimal: v === "" ? null : Number.parseFloat(v) || null,
                    }))
                  }}
                  placeholder="—"
                  className="h-8 w-24"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>{t("list.columnUnit")}</Label>
              <Input
                value={state.unit ?? ""}
                onChange={(e) => setState((p) => ({ ...p, unit: e.target.value || null }))}
                placeholder="mm"
                className="h-8 w-20"
              />
            </div>
          </>
        )}
        <div className="space-y-2">
          <Label htmlFor="attr-sortOrder">{t("list.columnSortOrder")}</Label>
          <Input
            id="attr-sortOrder"
            type="number"
            min="0"
            value={state.sortOrder}
            onChange={(e) =>
              setState((p) => ({
                ...p,
                sortOrder: Number.parseInt(e.target.value, 10) || 0,
              }))
            }
            className="h-8 w-20"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
        >
          {isSaving ? "…" : t("list.saveButton")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          asChild
        >
          <Link href={ROUTES.setupAttributePricing(productModelId, componentId, attribute.id)}>
            <BanknoteIcon className="size-3.5" />
            <span className="ml-1.5">{t("card.pricingButton")}</span>
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <TrashIcon className="size-3.5" />
          <span className="ml-1.5">{t("card.deleteButton")}</span>
        </Button>
      </div>
    </div>
  )
}
