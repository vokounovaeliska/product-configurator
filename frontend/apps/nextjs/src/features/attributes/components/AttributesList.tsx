"use client"

import { useMemo, useState } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BanknoteIcon,
  InfoIcon,
  ListIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Select } from "@workspace/ui/components/select"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Tooltip } from "@workspace/ui/components/tooltip"
import { Typography } from "@workspace/ui/components/typography"

import type { AttributeDto, AttributePatchRequestDto, AttributeType } from "@/api/attributeTypes"
import { Link } from "@/lib/i18n/navigation"
import { ROUTES } from "@/lib/routes"

import { useAttributesList, useUpdateAttribute } from "../api/attributeQueries"
import { CreateAttributeDialog } from "./CreateAttributeDialog"
import { DeleteAttributeDialog } from "./DeleteAttributeDialog"

type Props = {
  productModelId: string
  componentId: string
}

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

const _TYPE_LABEL_KEYS: Record<
  string,
  "create.typeEnum" | "create.typeInteger" | "create.typeDecimal" | "create.typeBoolean"
> = {
  ENUM: "create.typeEnum",
  INTEGER: "create.typeInteger",
  DECIMAL: "create.typeDecimal",
  BOOLEAN: "create.typeBoolean",
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

export const AttributesList = ({ productModelId, componentId }: Props) => {
  const t = useTranslations("Attributes")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [deletingAttribute, setDeletingAttribute] = useState<AttributeDto | null>(null)
  const [rowEdits, setRowEdits] = useState<Record<string, RowEditState>>({})

  const { data, isLoading, error } = useAttributesList(productModelId, componentId, {
    limit: 100,
  })
  const updateAttribute = useUpdateAttribute(productModelId, componentId)
  const attributes = useMemo(() => data?.items ?? [], [data?.items])
  const sortedAttributes = useMemo(
    () => [...attributes].sort((a, b) => a.sortOrder - b.sortOrder),
    [attributes],
  )
  const defaultSortOrder =
    attributes.length > 0 ? Math.max(...attributes.map((a) => a.sortOrder)) + 1 : 0

  const getRowState = (attr: AttributeDto): RowEditState =>
    rowEdits[attr.id] ?? attributeToRowState(attr)

  const setRowState = (attr: AttributeDto, updater: (prev: RowEditState) => RowEditState) => {
    setRowEdits((prev) => {
      const current = prev[attr.id] ?? attributeToRowState(attr)
      return { ...prev, [attr.id]: updater(current) }
    })
  }

  const handleMoveUp = (attribute: AttributeDto) => {
    const idx = sortedAttributes.findIndex((a) => a.id === attribute.id)
    if (idx <= 0) return
    const prev = sortedAttributes[idx - 1]
    if (!prev || updateAttribute.isPending) return
    updateAttribute.mutate({
      attributeId: attribute.id,
      patches: [{ path: "/sortOrder", value: prev.sortOrder, op: "Replace" }],
    })
    updateAttribute.mutate({
      attributeId: prev.id,
      patches: [{ path: "/sortOrder", value: attribute.sortOrder, op: "Replace" }],
    })
  }

  const handleMoveDown = (attribute: AttributeDto) => {
    const idx = sortedAttributes.findIndex((a) => a.id === attribute.id)
    if (idx < 0 || idx >= sortedAttributes.length - 1) return
    const next = sortedAttributes[idx + 1]
    if (!next || updateAttribute.isPending) return
    updateAttribute.mutate({
      attributeId: attribute.id,
      patches: [{ path: "/sortOrder", value: next.sortOrder, op: "Replace" }],
    })
    updateAttribute.mutate({
      attributeId: next.id,
      patches: [{ path: "/sortOrder", value: attribute.sortOrder, op: "Replace" }],
    })
  }

  const handleSave = (attribute: AttributeDto) => {
    const current = getRowState(attribute)
    const patches = buildPatches(attribute, current)
    if (patches.length > 0) {
      updateAttribute.mutate(
        { attributeId: attribute.id, patches },
        {
          onSuccess: () => {
            setRowEdits((prev) => {
              const next = { ...prev }
              delete next[attribute.id]
              return next
            })
          },
        },
      )
    }
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <Typography
          as="p"
          variant="body-md"
          className="text-destructive"
        >
          {t("list.errorMessage")}
        </Typography>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Typography
          as="h2"
          variant="display-lg"
          weight="semibold"
        >
          {t("list.title")}
        </Typography>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusIcon className="size-4" />
          <span className="ml-1.5">{t("list.createButton")}</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : sortedAttributes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Typography
            as="p"
            variant="body-lg"
            className="mb-4 text-muted-foreground"
          >
            {t("list.emptyState.message")}
          </Typography>
          <Button
            variant="outline"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <PlusIcon className="size-4" />
            <span className="ml-1.5">{t("list.emptyState.createButton")}</span>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[900px] caption-bottom text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th
                  className="h-9 w-10 px-2"
                  scope="col"
                />
                <th
                  className="h-9 px-3 text-left font-medium"
                  scope="col"
                >
                  {t("list.columnLabel")}
                </th>
                <th
                  className="h-9 px-3 text-left font-medium text-muted-foreground"
                  scope="col"
                >
                  <span className="inline-flex items-center gap-1">
                    {t("list.columnCode")}
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
                  </span>
                </th>
                <th
                  className="h-9 w-12 px-2 text-center font-medium"
                  scope="col"
                >
                  {t("create.isRequired")}
                </th>
                <th
                  className="h-9 px-3 text-left font-medium"
                  scope="col"
                >
                  {t("list.columnType")}
                </th>
                <th
                  className="h-9 px-3 text-left font-medium"
                  scope="col"
                >
                  {t("list.columnRange")}
                </th>
                <th
                  className="h-9 px-3 text-left font-medium"
                  scope="col"
                >
                  {t("list.columnDefault")}
                </th>
                <th
                  className="h-9 px-3 text-left font-medium"
                  scope="col"
                >
                  {t("list.columnUnit")}
                </th>
                <th
                  className="h-9 px-3 text-left font-medium"
                  scope="col"
                >
                  {t("list.columnOptions")}
                </th>
                <th
                  className="h-9 px-3 text-left font-medium"
                  scope="col"
                >
                  {t("list.columnPricing")}
                </th>
                <th
                  className="h-9 w-16 px-2 text-right font-medium tabular-nums"
                  scope="col"
                >
                  {t("list.columnSortOrder")}
                </th>
                <th
                  className="w-0 px-4 py-3 text-right font-medium"
                  scope="col"
                />
              </tr>
            </thead>
            <tbody>
              {sortedAttributes.map((attribute, index) => {
                const state = getRowState(attribute)
                const isNumeric = state.type === "INTEGER" || state.type === "DECIMAL"
                const isInteger = state.type === "INTEGER"
                const isSaving =
                  updateAttribute.isPending &&
                  updateAttribute.variables?.attributeId === attribute.id

                return (
                  <tr
                    key={attribute.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/20"
                  >
                    <td className="px-2 py-2 align-middle">
                      <div className="flex flex-col gap-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleMoveUp(attribute)}
                          title={t("card.moveUp")}
                          disabled={index === 0}
                        >
                          <ArrowUpIcon className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleMoveDown(attribute)}
                          title={t("card.moveDown")}
                          disabled={index === sortedAttributes.length - 1}
                        >
                          <ArrowDownIcon className="size-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <Input
                        value={state.label}
                        onChange={(e) =>
                          setRowState(attribute, (p) => ({ ...p, label: e.target.value }))
                        }
                        className="h-8 min-w-[100px]"
                        placeholder={t("create.labelPlaceholder")}
                        aria-label={t("list.columnLabel")}
                      />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <Input
                        value={state.code}
                        onChange={(e) =>
                          setRowState(attribute, (p) => ({ ...p, code: e.target.value }))
                        }
                        className="h-8 min-w-[80px] font-mono text-sm text-muted-foreground"
                        placeholder={t("create.codePlaceholder")}
                        aria-label={t("list.columnCode")}
                      />
                    </td>
                    <td className="px-2 py-2 text-center align-middle">
                      <Checkbox
                        checked={state.isRequired}
                        onCheckedChange={(checked) =>
                          setRowState(attribute, (p) => ({
                            ...p,
                            isRequired: checked === true,
                          }))
                        }
                        aria-label={t("create.isRequired")}
                      />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <Select
                        value={state.type}
                        onValueChange={(v) =>
                          setRowState(attribute, (p) => {
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
                        }
                      >
                        <Select.Trigger className="h-8 min-w-[100px]">
                          <Select.Trigger.Value />
                        </Select.Trigger>
                        <Select.Content>
                          <Select.Content.Item value="ENUM">
                            {t("create.typeEnum")}
                          </Select.Content.Item>
                          <Select.Content.Item value="INTEGER">
                            {t("create.typeInteger")}
                          </Select.Content.Item>
                          <Select.Content.Item value="DECIMAL">
                            {t("create.typeDecimal")}
                          </Select.Content.Item>
                          <Select.Content.Item value="BOOLEAN">
                            {t("create.typeBoolean")}
                          </Select.Content.Item>
                        </Select.Content>
                      </Select>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      {isNumeric ? (
                        <div className="flex items-center gap-1">
                          {isInteger ? (
                            <>
                              <Input
                                type="number"
                                value={state.minInt ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setRowState(attribute, (p) => ({
                                    ...p,
                                    minInt: v === "" ? null : Number.parseInt(v, 10) || null,
                                  }))
                                }}
                                className="h-8 w-16"
                                placeholder="min"
                                aria-label={t("create.minInt")}
                              />
                              <span className="text-muted-foreground">–</span>
                              <Input
                                type="number"
                                value={state.maxInt ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setRowState(attribute, (p) => ({
                                    ...p,
                                    maxInt: v === "" ? null : Number.parseInt(v, 10) || null,
                                  }))
                                }}
                                className="h-8 w-16"
                                placeholder="max"
                                aria-label={t("create.maxInt")}
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
                                  setRowState(attribute, (p) => ({
                                    ...p,
                                    minDecimal: v === "" ? null : Number.parseFloat(v) || null,
                                  }))
                                }}
                                className="h-8 w-16"
                                placeholder="min"
                                aria-label={t("create.minDecimal")}
                              />
                              <span className="text-muted-foreground">–</span>
                              <Input
                                type="number"
                                step="0.01"
                                value={state.maxDecimal ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setRowState(attribute, (p) => ({
                                    ...p,
                                    maxDecimal: v === "" ? null : Number.parseFloat(v) || null,
                                  }))
                                }}
                                className="h-8 w-16"
                                placeholder="max"
                                aria-label={t("create.maxDecimal")}
                              />
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      {isNumeric ? (
                        isInteger ? (
                          <Input
                            type="number"
                            value={state.defaultInt ?? ""}
                            onChange={(e) => {
                              const v = e.target.value
                              setRowState(attribute, (p) => ({
                                ...p,
                                defaultInt: v === "" ? null : Number.parseInt(v, 10) || null,
                              }))
                            }}
                            className="h-8 w-20"
                            placeholder="—"
                            aria-label={t("list.columnDefault")}
                          />
                        ) : (
                          <Input
                            type="number"
                            step="0.01"
                            value={state.defaultDecimal ?? ""}
                            onChange={(e) => {
                              const v = e.target.value
                              setRowState(attribute, (p) => ({
                                ...p,
                                defaultDecimal: v === "" ? null : Number.parseFloat(v) || null,
                              }))
                            }}
                            className="h-8 w-20"
                            placeholder="—"
                            aria-label={t("list.columnDefault")}
                          />
                        )
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      {isNumeric ? (
                        <Input
                          value={state.unit ?? ""}
                          onChange={(e) =>
                            setRowState(attribute, (p) => ({
                              ...p,
                              unit: e.target.value || null,
                            }))
                          }
                          className="h-8 w-16"
                          placeholder="mm"
                          aria-label={t("list.columnUnit")}
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      {attribute.type === "ENUM" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link
                            href={ROUTES.setupAttributeOptions(
                              productModelId,
                              componentId,
                              attribute.id,
                            )}
                          >
                            <ListIcon className="size-3.5" />
                            <span className="ml-1.5">{t("card.manageOptionsButton")}</span>
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <Link
                          href={ROUTES.setupAttributePricing(
                            productModelId,
                            componentId,
                            attribute.id,
                          )}
                        >
                          <BanknoteIcon className="size-3.5" />
                          <span className="ml-1.5">{t("card.pricingButton")}</span>
                        </Link>
                      </Button>
                    </td>
                    <td className="px-2 py-2 align-middle">
                      <Input
                        type="number"
                        min="0"
                        value={state.sortOrder}
                        onChange={(e) =>
                          setRowState(attribute, (p) => ({
                            ...p,
                            sortOrder: Number.parseInt(e.target.value, 10) || 0,
                          }))
                        }
                        className="h-8 w-14 text-right"
                        aria-label={t("list.columnSortOrder")}
                      />
                    </td>
                    <td className="px-4 py-2 align-middle">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleSave(attribute)}
                          disabled={
                            isSaving ||
                            JSON.stringify(attributeToRowState(attribute)) === JSON.stringify(state)
                          }
                        >
                          {isSaving ? "…" : t("list.saveButton")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => setDeletingAttribute(attribute)}
                          title={t("card.deleteButton")}
                        >
                          <TrashIcon className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/20">
                <td
                  colSpan={12}
                  className="px-4 py-3"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <PlusIcon className="size-4" />
                    <span className="ml-1.5">{t("list.createButton")}</span>
                  </Button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <CreateAttributeDialog
        productModelId={productModelId}
        componentId={componentId}
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        defaultSortOrder={defaultSortOrder}
      />

      {deletingAttribute && (
        <DeleteAttributeDialog
          attribute={deletingAttribute}
          productModelId={productModelId}
          componentId={componentId}
          isOpen={true}
          onOpenChange={(isOpen) => !isOpen && setDeletingAttribute(null)}
        />
      )}
    </div>
  )
}
