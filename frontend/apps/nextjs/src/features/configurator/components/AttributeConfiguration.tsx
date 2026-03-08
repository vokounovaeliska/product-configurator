"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import { useAttributeOptionsList } from "@/api/attributeOptionQueries"
import { useAttributesList } from "@/api/attributeQueries"
import type { AttributeDto, AttributeOptionDto } from "@/api/attributeTypes"
import type { AttributePricingRuleDto } from "@/api/pricingTypes"
import { getImageUrlForDisplay } from "@/utils/imageUrl"

type Props = {
  componentId: string
  productModelId: string
  selectedOptionsByAttribute: Record<string, AttributeOptionDto | null>
  onSelectOption: (attributeId: string, option: AttributeOptionDto | null) => void
  /** When provided with onOtherChange, numeric/boolean values are controlled by parent (for price preview). */
  selectedOtherValuesByAttribute?: Record<string, number | boolean>
  onOtherChange?: (attributeId: string, value: number | boolean) => void
  pricingRules?: AttributePricingRuleDto[]
  currency?: string
}

export const AttributeConfiguration = ({
  componentId,
  productModelId,
  selectedOptionsByAttribute,
  onSelectOption,
  selectedOtherValuesByAttribute,
  onOtherChange,
  pricingRules = [],
  currency,
}: Props) => {
  const t = useTranslations("Configurator")
  const [localOtherValues, setLocalOtherValues] = useState<Record<string, number | boolean>>({})

  const otherValues =
    onOtherChange && selectedOtherValuesByAttribute != null
      ? selectedOtherValuesByAttribute
      : localOtherValues
  const handleOtherChange =
    onOtherChange ??
    ((attributeId: string, value: number | boolean) => {
      setLocalOtherValues((prev) => ({ ...prev, [attributeId]: value }))
    })

  const { data: attributesData, isLoading: isAttributesLoading } = useAttributesList(
    productModelId,
    componentId,
    { limit: 50 },
  )

  const attributes = [...(attributesData?.items ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)

  if (isAttributesLoading) {
    return (
      <div className="space-y-4">
        <Typography
          as="h4"
          variant="body-lg"
          weight="semibold"
        >
          {t("attributes.title")}
        </Typography>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    )
  }

  if (attributes.length === 0) {
    return (
      <div className="space-y-4">
        <Typography
          as="h4"
          variant="body-lg"
          weight="semibold"
        >
          {t("attributes.title")}
        </Typography>
        <Typography
          as="p"
          variant="body-sm"
          className="text-muted-foreground"
        >
          {t("attributes.noAttributes")}
        </Typography>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Typography
        as="h4"
        variant="body-lg"
        weight="semibold"
      >
        {t("attributes.title")}
      </Typography>
      <div className="space-y-4">
        {attributes.map((attr) => (
          <AttributeField
            key={attr.id}
            attribute={attr}
            productModelId={productModelId}
            componentId={componentId}
            selectedOption={selectedOptionsByAttribute[attr.id] ?? null}
            onSelectOption={(option) => onSelectOption(attr.id, option)}
            otherValue={otherValues[attr.id]}
            onOtherChange={(value) => handleOtherChange(attr.id, value)}
            pricingRules={pricingRules}
            currency={currency}
          />
        ))}
      </div>
    </div>
  )
}

type AttributeFieldProps = {
  attribute: AttributeDto
  productModelId: string
  componentId: string
  selectedOption: AttributeOptionDto | null
  onSelectOption: (option: AttributeOptionDto | null) => void
  otherValue: number | boolean | undefined
  onOtherChange: (value: number | boolean) => void
  pricingRules?: AttributePricingRuleDto[]
  currency?: string
}

const AttributeField = ({
  attribute,
  productModelId,
  componentId,
  selectedOption,
  onSelectOption,
  otherValue,
  onOtherChange,
  pricingRules = [],
  currency = "CZK",
}: AttributeFieldProps) => {
  const t = useTranslations("Configurator")

  if (attribute.type === "ENUM") {
    return (
      <AttributeSelect
        productModelId={productModelId}
        componentId={componentId}
        attributeId={attribute.id}
        attributeLabel={attribute.label}
        selectedOption={selectedOption}
        onSelectOption={onSelectOption}
      />
    )
  }

  if (attribute.type === "INTEGER") {
    const value =
      typeof otherValue === "number" ? otherValue : (attribute.defaultInt ?? attribute.minInt ?? 0)
    const rule = getRuleForNumericValue(pricingRules, componentId, attribute.code, value)
    const formatPrice = (cents: number) =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      }).format(cents / 100)
    return (
      <div className="space-y-2">
        <Label htmlFor={`attr-${attribute.id}`}>
          {attribute.label}
          {attribute.unit?.trim() && (
            <span className="ml-1 font-normal text-muted-foreground">({attribute.unit})</span>
          )}
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id={`attr-${attribute.id}`}
            type="number"
            min={attribute.minInt ?? undefined}
            max={attribute.maxInt ?? undefined}
            value={value}
            onChange={(e) => {
              const v = Number.parseInt(e.target.value, 10)
              if (!Number.isNaN(v)) onOtherChange(v)
            }}
            placeholder={t("attributes.numberPlaceholder")}
          />
          {attribute.unit?.trim() && (
            <span className="shrink-0 text-sm text-muted-foreground">{attribute.unit.trim()}</span>
          )}
        </div>
        {rule && (
          <Typography
            as="p"
            variant="body-sm"
            className="text-muted-foreground"
          >
            {t("attributes.priceForRange", { amount: formatPrice(rule.priceDeltaCents) })}
          </Typography>
        )}
      </div>
    )
  }

  if (attribute.type === "DECIMAL") {
    const value =
      typeof otherValue === "number"
        ? otherValue
        : (attribute.defaultDecimal ?? attribute.minDecimal ?? 0)
    const rule = getRuleForNumericValue(pricingRules, componentId, attribute.code, value)
    const formatPrice = (cents: number) =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      }).format(cents / 100)
    return (
      <div className="space-y-2">
        <Label htmlFor={`attr-${attribute.id}`}>
          {attribute.label}
          {attribute.unit?.trim() && (
            <span className="ml-1 font-normal text-muted-foreground">({attribute.unit})</span>
          )}
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id={`attr-${attribute.id}`}
            type="number"
            step="any"
            min={attribute.minDecimal ?? undefined}
            max={attribute.maxDecimal ?? undefined}
            value={value}
            onChange={(e) => {
              const v = Number.parseFloat(e.target.value)
              if (!Number.isNaN(v)) onOtherChange(v)
            }}
            placeholder={t("attributes.numberPlaceholder")}
          />
          {attribute.unit?.trim() && (
            <span className="shrink-0 text-sm text-muted-foreground">{attribute.unit.trim()}</span>
          )}
        </div>
        {rule && (
          <Typography
            as="p"
            variant="body-sm"
            className="text-muted-foreground"
          >
            {t("attributes.priceForRange", { amount: formatPrice(rule.priceDeltaCents) })}
          </Typography>
        )}
      </div>
    )
  }

  if (attribute.type === "BOOLEAN") {
    const isChecked = typeof otherValue === "boolean" ? otherValue : false
    return (
      <div className="flex items-center gap-2 space-y-0">
        <Checkbox
          id={`attr-${attribute.id}`}
          checked={isChecked}
          onCheckedChange={(c) => onOtherChange(c === true)}
        />
        <Label
          htmlFor={`attr-${attribute.id}`}
          className="cursor-pointer font-normal"
        >
          {attribute.label}
        </Label>
      </div>
    )
  }

  return null
}

type AttributeSelectProps = {
  productModelId: string
  componentId: string
  attributeId: string
  attributeLabel: string
  selectedOption: AttributeOptionDto | null
  onSelectOption: (option: AttributeOptionDto | null) => void
}

/** Find the pricing rule that applies to the current numeric value (EQ or BETWEEN). */
function getRuleForNumericValue(
  rules: AttributePricingRuleDto[],
  componentId: string,
  attributeCode: string,
  currentValue: number,
): AttributePricingRuleDto | undefined {
  return rules.find((r) => {
    if (r.componentId !== componentId && r.componentId != null) return false
    if (r.attributeCode !== attributeCode) return false
    const from = Number.parseFloat(r.value)
    if (Number.isNaN(from)) return false
    if (r.operator === "EQ") return currentValue === from
    if (r.operator === "BETWEEN") {
      const to = r.toValue != null ? Number.parseFloat(r.toValue) : from
      return !Number.isNaN(to) && currentValue >= from && currentValue <= to
    }
    return false
  })
}

const AttributeSelect = ({
  productModelId,
  componentId,
  attributeId,
  attributeLabel,
  selectedOption,
  onSelectOption,
}: AttributeSelectProps) => {
  const t = useTranslations("Configurator")

  const { data: options, isLoading } = useAttributeOptionsList(
    productModelId,
    componentId,
    attributeId,
    { enabled: Boolean(productModelId && componentId && attributeId) },
  )

  const sortedOptions = [...(options ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)
  const hasSetDefaultRef = useRef(false)

  // Set first option as default once when options load and none is selected
  useEffect(() => {
    const first = sortedOptions[0]
    if (hasSetDefaultRef.current || !first || selectedOption !== null) return
    hasSetDefaultRef.current = true
    onSelectOption(first)
  }, [sortedOptions, selectedOption, onSelectOption])

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>{attributeLabel}</Label>
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  const hasImages = sortedOptions.some((o) => o.imageUrl)

  return (
    <div className="space-y-2">
      <Label id={`attr-${attributeId}-label`}>{attributeLabel}</Label>
      <div
        role="listbox"
        aria-labelledby={`attr-${attributeId}-label`}
        aria-label={attributeLabel}
        className={cn(
          "flex flex-wrap gap-1.5",
          hasImages && "grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6",
        )}
      >
        <button
          type="button"
          role="option"
          aria-selected={selectedOption === null}
          onClick={() => onSelectOption(null)}
          className={cn(
            "flex min-w-0 items-center justify-center rounded border-2 px-2 py-1 text-xs font-medium transition-colors",
            selectedOption === null
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-muted",
            hasImages ? "col-span-1" : "",
          )}
        >
          {t("attributes.noSelection")}
        </button>
        {sortedOptions.map((opt) => {
          const isSelected = selectedOption?.id === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelectOption(opt)}
              className={cn(
                "flex min-w-0 flex-col items-center gap-0.5 rounded border-2 transition-colors",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-muted",
                hasImages ? "overflow-hidden p-0" : "px-2 py-1 text-xs font-medium",
              )}
            >
              {hasImages && opt.imageUrl ? (
                <>
                  <div className="relative mx-auto aspect-square w-10 shrink-0 overflow-hidden bg-muted">
                    <Image
                      src={getImageUrlForDisplay(opt.imageUrl)}
                      alt=""
                      fill
                      className="object-contain"
                      unoptimized
                      sizes="40px"
                    />
                  </div>
                  <span className="w-full truncate px-1 pb-1 text-center text-[10px] font-medium">
                    {opt.label}
                  </span>
                </>
              ) : (
                <span className="truncate text-xs font-medium">{opt.label}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
