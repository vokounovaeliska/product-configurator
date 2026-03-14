"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { cn } from "@workspace/ui/lib/utils"

import type { AttributeDto, AttributeOptionDto } from "@/api/attributeTypes"
import type { AttributePricingRuleDto } from "@/api/pricingTypes"
import { getImageUrlForDisplay } from "@/utils/imageUrl"

type Props = {
  attribute: AttributeDto
  options: AttributeOptionDto[]
  selectedOption: AttributeOptionDto | null
  onSelectOption: (option: AttributeOptionDto | null) => void
  otherValue: number | boolean | undefined
  onOtherChange: (value: number | boolean) => void
  componentId: string
  pricingRules: AttributePricingRuleDto[]
  currency: string
}

function getPriceForOption(
  rules: AttributePricingRuleDto[],
  componentId: string,
  attributeCode: string,
  optionValue: string,
): number | null {
  const rule = rules.find(
    (r) =>
      (r.componentId === componentId || r.componentId == null) &&
      r.attributeCode === attributeCode &&
      r.operator === "EQ" &&
      r.value === optionValue,
  )
  return rule ? rule.price : null
}

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

export const EmbedAttributeField = ({
  attribute,
  options,
  selectedOption,
  onSelectOption,
  otherValue,
  onOtherChange,
  componentId,
  pricingRules,
  currency,
}: Props) => {
  const t = useTranslations("Configurator")
  const [localEditValue, setLocalEditValue] = useState<string | null>(null)
  const formatPrice = (cents: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(cents / 100)

  const sortedOptions = [...options].sort((a, b) => a.sortOrder - b.sortOrder)
  const hasSetDefaultRef = useRef(false)

  useEffect(() => {
    const first = sortedOptions[0]
    if (hasSetDefaultRef.current || !first || selectedOption !== null) return
    hasSetDefaultRef.current = true
    onSelectOption(first)
  }, [sortedOptions, selectedOption, onSelectOption])

  if (attribute.type === "ENUM") {
    const hasImages = sortedOptions.some((o) => o.imageUrl)

    return (
      <div className="space-y-2">
        <Label id={`attr-${attribute.id}-label`}>{attribute.label}</Label>
        <div
          role="listbox"
          aria-labelledby={`attr-${attribute.id}-label`}
          aria-label={attribute.label}
          className={cn(
            "flex flex-wrap gap-1.5",
            hasImages && "grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6",
          )}
        >
          {sortedOptions.map((opt) => {
            const isSelected = selectedOption?.id === opt.id
            const priceCents = getPriceForOption(
              pricingRules,
              componentId,
              attribute.code,
              opt.value,
            )
            const hasPrice = priceCents != null && priceCents !== 0
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelectOption(opt)}
                className={cn(
                  "flex min-h-[36px] min-w-0 touch-manipulation flex-col items-center justify-center gap-0.5 rounded border-2 transition-colors",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-muted",
                  hasImages ? "overflow-hidden p-0" : "px-2 py-1 text-xs font-medium",
                )}
              >
                {hasImages && opt.imageUrl ? (
                  <>
                    <div className="relative mx-auto aspect-square w-10 shrink-0 overflow-hidden rounded-sm bg-muted">
                      <Image
                        src={getImageUrlForDisplay(opt.imageUrl)}
                        alt={opt.label}
                        fill
                        className="object-cover"
                        unoptimized
                        sizes="40px"
                      />
                    </div>
                    {hasPrice && (
                      <span className="shrink-0 px-1 pb-1 text-[9px] text-muted-foreground">
                        {t("attributes.optionPrice", {
                          amount: formatPrice(priceCents),
                        })}
                      </span>
                    )}
                  </>
                ) : (
                  <div className="flex min-w-0 flex-col items-center gap-0 px-1.5 py-0.5">
                    <span
                      className="truncate text-xs font-medium"
                      title={opt.label}
                    >
                      {opt.label}
                    </span>
                    {hasPrice && (
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {t("attributes.optionPrice", {
                          amount: formatPrice(priceCents),
                        })}
                      </span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (attribute.type === "INTEGER") {
    const value =
      typeof otherValue === "number" ? otherValue : (attribute.defaultInt ?? attribute.minInt ?? 0)
    const displayValue = localEditValue ?? String(value)
    const rule = getRuleForNumericValue(pricingRules, componentId, attribute.code, value)
    const commitInteger = (raw: string) => {
      setLocalEditValue(null)
      const v = Number.parseInt(raw, 10)
      if (Number.isNaN(v)) {
        onOtherChange(value)
        return
      }
      const min = attribute.minInt ?? -Number.MAX_SAFE_INTEGER
      const max = attribute.maxInt ?? Number.MAX_SAFE_INTEGER
      onOtherChange(Math.max(min, Math.min(max, v)))
    }
    const handleIntegerChange = (raw: string) => {
      setLocalEditValue(raw)
      const v = Number.parseInt(raw, 10)
      if (!Number.isNaN(v)) {
        const min = attribute.minInt ?? -Number.MAX_SAFE_INTEGER
        const max = attribute.maxInt ?? Number.MAX_SAFE_INTEGER
        onOtherChange(Math.max(min, Math.min(max, v)))
      }
    }
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
            value={displayValue}
            onChange={(e) => handleIntegerChange(e.target.value)}
            onFocus={() => setLocalEditValue(String(value))}
            onBlur={(e) => commitInteger(e.target.value)}
            placeholder={t("attributes.numberPlaceholder")}
            className="min-h-[44px] text-base"
          />
          {attribute.unit?.trim() && (
            <span className="shrink-0 text-sm text-muted-foreground">{attribute.unit.trim()}</span>
          )}
        </div>
        {rule && (
          <p className="text-sm text-muted-foreground">
            {t("attributes.priceForRange", { amount: formatPrice(rule.price) })}
          </p>
        )}
      </div>
    )
  }

  if (attribute.type === "DECIMAL") {
    const value =
      typeof otherValue === "number"
        ? otherValue
        : (attribute.defaultDecimal ?? attribute.minDecimal ?? 0)
    const displayValue = localEditValue ?? String(value)
    const rule = getRuleForNumericValue(pricingRules, componentId, attribute.code, value)
    const commitDecimal = (raw: string) => {
      setLocalEditValue(null)
      const v = Number.parseFloat(raw)
      if (Number.isNaN(v)) {
        onOtherChange(value)
        return
      }
      const min = attribute.minDecimal ?? -Number.MAX_VALUE
      const max = attribute.maxDecimal ?? Number.MAX_VALUE
      onOtherChange(Math.max(min, Math.min(max, v)))
    }
    const handleDecimalChange = (raw: string) => {
      setLocalEditValue(raw)
      const v = Number.parseFloat(raw)
      if (!Number.isNaN(v)) {
        const min = attribute.minDecimal ?? -Number.MAX_VALUE
        const max = attribute.maxDecimal ?? Number.MAX_VALUE
        onOtherChange(Math.max(min, Math.min(max, v)))
      }
    }
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
            value={displayValue}
            onChange={(e) => handleDecimalChange(e.target.value)}
            onFocus={() => setLocalEditValue(String(value))}
            onBlur={(e) => commitDecimal(e.target.value)}
            placeholder={t("attributes.numberPlaceholder")}
            className="min-h-[44px] text-base"
          />
          {attribute.unit?.trim() && (
            <span className="shrink-0 text-sm text-muted-foreground">{attribute.unit.trim()}</span>
          )}
        </div>
        {rule && (
          <p className="text-sm text-muted-foreground">
            {t("attributes.priceForRange", { amount: formatPrice(rule.price) })}
          </p>
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
