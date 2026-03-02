"use client"

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
  return rule ? rule.priceDeltaCents : null
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
  const formatPrice = (cents: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(cents / 100)

  const sortedOptions = [...options].sort((a, b) => a.sortOrder - b.sortOrder)

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
            "flex flex-wrap gap-2",
            hasImages && "grid grid-cols-4 gap-2 sm:grid-cols-5",
          )}
        >
          <button
            type="button"
            role="option"
            aria-selected={selectedOption === null}
            onClick={() => onSelectOption(null)}
            className={cn(
              "flex min-w-0 items-center justify-center rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors",
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
                  "flex min-w-0 flex-col items-center gap-1 rounded-lg border-2 transition-colors",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-muted",
                  hasImages ? "overflow-hidden p-0" : "px-3 py-2 text-sm font-medium",
                )}
              >
                {hasImages && opt.imageUrl ? (
                  <>
                    <div className="relative mx-auto aspect-square w-12 shrink-0 overflow-hidden rounded-sm bg-muted sm:w-14">
                      <Image
                        src={getImageUrlForDisplay(opt.imageUrl)}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                        sizes="56px"
                      />
                    </div>
                    <div className="flex min-w-0 flex-col items-center gap-0.5 px-1 pb-1.5">
                      <span
                        className="w-full truncate text-center text-xs font-medium"
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
                  </>
                ) : (
                  <div className="flex min-w-0 flex-col items-center gap-0.5 px-2 py-1.5">
                    <span className="flex items-center gap-1.5">
                      {opt.colorHex && (
                        <span
                          className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border border-border"
                          style={{ backgroundColor: opt.colorHex }}
                        />
                      )}
                      <span
                        className="truncate text-sm font-medium"
                        title={opt.label}
                      >
                        {opt.label}
                      </span>
                    </span>
                    {hasPrice && (
                      <span className="shrink-0 text-xs text-muted-foreground">
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
    const rule = getRuleForNumericValue(pricingRules, componentId, attribute.code, value)
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
          <p className="text-sm text-muted-foreground">
            {t("attributes.priceForRange", { amount: formatPrice(rule.priceDeltaCents) })}
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
    const rule = getRuleForNumericValue(pricingRules, componentId, attribute.code, value)
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
          <p className="text-sm text-muted-foreground">
            {t("attributes.priceForRange", { amount: formatPrice(rule.priceDeltaCents) })}
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
