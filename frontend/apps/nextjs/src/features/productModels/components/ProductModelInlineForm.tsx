"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Select } from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"
import { Typography } from "@workspace/ui/components/typography"

import type { ProductModelDto } from "@/api/productModelTypes"
import { formatMoneyMainAndCurrency, parseWholeCurrencyInput } from "@/lib/moneyFormat"

import { useUpdateProductModel } from "../api/productModelQueries"

const CURRENCIES = ["CZK", "EUR", "USD", "GBP"] as const

type RowState = {
  name: string
  description: string
  /** Major currency units while editing (allows empty field without forcing 0). */
  priceInput: string
  currency: string
  isActive: boolean
}

const toRowState = (p: ProductModelDto): RowState => ({
  name: p.name,
  description: p.description ?? "",
  priceInput: String(Math.round(p.price)),
  currency: p.currency,
  isActive: p.isActive,
})

type Props = {
  productModel: ProductModelDto
}

export const ProductModelInlineForm = ({ productModel }: Props) => {
  const t = useTranslations("ProductModels")
  const [isEditing, setIsEditing] = useState(false)
  const [state, setState] = useState<RowState>(() => toRowState(productModel))
  const updateProductModel = useUpdateProductModel()

  useEffect(() => {
    setState(toRowState(productModel))
  }, [productModel])

  const isSaving = updateProductModel.isPending
  const parsedPrice = parseWholeCurrencyInput(state.priceInput)
  const effectivePrice = parsedPrice ?? 0
  const hasChanges =
    state.name !== productModel.name ||
    state.description !== (productModel.description ?? "") ||
    effectivePrice !== productModel.price ||
    state.currency !== productModel.currency ||
    state.isActive !== productModel.isActive

  const handleDiscard = () => {
    setState(toRowState(productModel))
    setIsEditing(false)
  }

  const handleSave = () => {
    const patches: {
      path: "SlashName" | "SlashDescription" | "SlashPrice" | "SlashCurrency" | "SlashIsActive"
      value: unknown
      op: "Replace"
    }[] = []
    if (state.name !== productModel.name) {
      patches.push({ path: "SlashName", value: state.name, op: "Replace" })
    }
    if (state.description !== (productModel.description ?? "")) {
      patches.push({ path: "SlashDescription", value: state.description || null, op: "Replace" })
    }
    if (effectivePrice !== productModel.price) {
      patches.push({ path: "SlashPrice", value: effectivePrice, op: "Replace" })
    }
    if (state.currency !== productModel.currency) {
      patches.push({ path: "SlashCurrency", value: state.currency, op: "Replace" })
    }
    if (state.isActive !== productModel.isActive) {
      patches.push({ path: "SlashIsActive", value: state.isActive, op: "Replace" })
    }
    if (patches.length > 0) {
      updateProductModel.mutate(
        { id: productModel.id, patches },
        { onSuccess: () => setIsEditing(false) },
      )
    } else {
      setIsEditing(false)
    }
  }

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <Typography
              as="span"
              variant="body-sm"
              className="text-muted-foreground"
            >
              {t("edit.name.label")}
            </Typography>
            <p className="text-sm font-medium">{productModel.name}</p>
          </div>
          <div className="space-y-1">
            <Typography
              as="span"
              variant="body-sm"
              className="text-muted-foreground"
            >
              {t("edit.price.label")}
            </Typography>
            <p className="text-sm font-medium">
              {formatMoneyMainAndCurrency(productModel.price, productModel.currency)}
            </p>
          </div>
          <div className="space-y-1">
            <Typography
              as="span"
              variant="body-sm"
              className="text-muted-foreground"
            >
              {t("edit.isActive")}
            </Typography>
            <p className="text-sm font-medium">
              {productModel.isActive ? t("card.active") : t("card.inactive")}
            </p>
          </div>
        </div>
        <div className="space-y-1">
          <Typography
            as="span"
            variant="body-sm"
            className="text-muted-foreground"
          >
            {t("edit.description.label")}
          </Typography>
          <p className="text-sm font-medium whitespace-pre-wrap">
            {productModel.description ?? "—"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(true)}
          >
            {t("card.editButton")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Inline: name, price, currency */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="pm-name">{t("edit.name.label")}</Label>
          <Input
            id="pm-name"
            value={state.name}
            onChange={(e) => setState((p) => ({ ...p, name: e.target.value }))}
            placeholder={t("edit.name.placeholder")}
            className="h-8"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pm-price">{t("edit.price.label")}</Label>
          <Input
            id="pm-price"
            inputMode="numeric"
            autoComplete="off"
            value={state.priceInput}
            onChange={(e) => setState((p) => ({ ...p, priceInput: e.target.value }))}
            onBlur={() => {
              const p = parseWholeCurrencyInput(state.priceInput)
              if (p !== null) {
                setState((s) => ({ ...s, priceInput: String(p) }))
              } else if (state.priceInput.trim() === "") {
                setState((s) => ({ ...s, priceInput: "0" }))
              } else {
                setState((s) => ({
                  ...s,
                  priceInput: String(Math.round(productModel.price)),
                }))
              }
            }}
            placeholder={t("edit.price.placeholder")}
            className="h-8"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pm-currency">{t("edit.currency.label")}</Label>
          <Select
            value={state.currency}
            onValueChange={(v) => setState((p) => ({ ...p, currency: v }))}
          >
            <Select.Trigger
              id="pm-currency"
              className="h-8"
            >
              <Select.Trigger.Value placeholder={t("edit.currency.placeholder")} />
            </Select.Trigger>
            <Select.Content>
              {CURRENCIES.map((c) => (
                <Select.Content.Item
                  key={c}
                  value={c}
                >
                  {c}
                </Select.Content.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
      </div>

      {/* Inline: description */}
      <div className="space-y-2">
        <Label htmlFor="pm-description">{t("edit.description.label")}</Label>
        <Textarea
          id="pm-description"
          value={state.description}
          onChange={(e) => setState((p) => ({ ...p, description: e.target.value }))}
          placeholder={t("edit.description.placeholder")}
          rows={2}
          className="min-h-0 resize-none"
        />
      </div>

      {/* isActive + actions row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="pm-isActive"
            checked={state.isActive}
            onCheckedChange={(checked) => setState((p) => ({ ...p, isActive: checked === true }))}
          />
          <Label
            htmlFor="pm-isActive"
            className="cursor-pointer text-sm font-normal"
          >
            {t("edit.isActive")}
          </Label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? "…" : t("edit.submitButton")}
          </Button>
          {hasChanges ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDiscard}
              disabled={isSaving}
            >
              {t("edit.discardButton.label")}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              {t("edit.cancelButton")}
            </Button>
          )}
        </div>
      </div>

      {updateProductModel.isError && (
        <p className="text-sm text-destructive">
          {updateProductModel.error instanceof Error
            ? updateProductModel.error.message
            : t("edit.errorMessages.generalError")}
        </p>
      )}
    </div>
  )
}
