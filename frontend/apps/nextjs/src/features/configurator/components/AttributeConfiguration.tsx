"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Tooltip } from "@workspace/ui/components/tooltip"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import { useAttributeOptionsList } from "@/api/attributeOptionQueries"
import { useAttributesList } from "@/api/attributeQueries"
import type { AttributeDto, AttributeOptionDto } from "@/api/attributeTypes"
import type { AttributePricingRuleDto } from "@/api/pricingTypes"
import { getImageUrlForDisplay } from "@/utils/imageUrl"

import { getPriceForOption } from "@/features/configurator/utils/computePriceFromRules"

type Props = {
  componentId: string
  productModelId: string
  selectedOptionsByAttribute: Record<string, AttributeOptionDto | null>
  onSelectOption: (
    attributeId: string,
    option: AttributeOptionDto | null,
    isInitialEnumDefault?: boolean,
  ) => void

  selectedOtherValuesByAttribute?: Record<string, number | boolean>
  onOtherChange?: (attributeId: string, value: number | boolean) => void
  pricingRules?: AttributePricingRuleDto[]
  currency?: string

  attributes?: AttributeDto[]
  optionsByAttribute?: Record<string, AttributeOptionDto[]>

  shouldShowSectionHeading?: boolean
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
  attributes: attributesProp,
  optionsByAttribute: optionsByAttributeProp,
  shouldShowSectionHeading = true,
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
    { enabled: attributesProp == null },
  )

  const attributes =
    attributesProp != null
      ? [...attributesProp].sort((a, b) => a.sortOrder - b.sortOrder)
      : [...(attributesData?.items ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)

  if (attributesProp == null && isAttributesLoading) {
    return (
      <div className="space-y-3">
        {shouldShowSectionHeading && (
          <Typography
            as="h4"
            variant="body-md"
            weight="semibold"
          >
            {t("attributes.title")}
          </Typography>
        )}
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    )
  }

  if (attributes.length === 0) {
    return (
      <div className="space-y-3">
        {shouldShowSectionHeading && (
          <Typography
            as="h4"
            variant="body-md"
            weight="semibold"
          >
            {t("attributes.title")}
          </Typography>
        )}
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
    <div className="space-y-3">
      {shouldShowSectionHeading && (
        <Typography
          as="h4"
          variant="body-md"
          weight="semibold"
        >
          {t("attributes.title")}
        </Typography>
      )}
      <div className="space-y-3">
        {attributes.map((attr) => (
          <AttributeField
            key={attr.id}
            attribute={attr}
            productModelId={productModelId}
            componentId={componentId}
            selectedOption={selectedOptionsByAttribute[attr.id] ?? null}
            onSelectOption={(option, isInitialEnumDefault) =>
              onSelectOption(attr.id, option, isInitialEnumDefault)
            }
            otherValue={otherValues[attr.id]}
            onOtherChange={(value) => handleOtherChange(attr.id, value)}
            pricingRules={pricingRules}
            currency={currency}
            options={optionsByAttributeProp?.[attr.id]}
          />
        ))}
      </div>
    </div>
  )
}

const DIMENSION_CODE_PATTERN = /length|width|height|tloustka|thickness|lenx|leny|lenz/i

function getDisplayAttributeUnit(unit: string | null | undefined, code: string): string | null {
  const u = unit?.trim()
  if (!u) return null
  if (u.toUpperCase() === "STRING" && DIMENSION_CODE_PATTERN.test(code)) {
    return "cm"
  }
  return u
}

type AttributeFieldProps = {
  attribute: AttributeDto
  productModelId: string
  componentId: string
  selectedOption: AttributeOptionDto | null
  onSelectOption: (option: AttributeOptionDto | null, isInitialEnumDefault?: boolean) => void
  otherValue: number | boolean | undefined
  onOtherChange: (value: number | boolean) => void
  pricingRules?: AttributePricingRuleDto[]
  currency?: string

  options?: AttributeOptionDto[]
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
  options,
}: AttributeFieldProps) => {
  const t = useTranslations("Configurator")
  const [localEditValue, setLocalEditValue] = useState<string | null>(null)

  if (attribute.type === "ENUM") {
    return (
      <AttributeSelect
        productModelId={productModelId}
        componentId={componentId}
        attributeId={attribute.id}
        attributeCode={attribute.code}
        attributeLabel={attribute.label}
        selectedOption={selectedOption}
        onSelectOption={onSelectOption}
        options={options}
        pricingRules={pricingRules}
        currency={currency}
      />
    )
  }

  if (attribute.type === "INTEGER") {
    const displayUnit = getDisplayAttributeUnit(attribute.unit, attribute.code)
    const value =
      typeof otherValue === "number" ? otherValue : (attribute.defaultInt ?? attribute.minInt ?? 0)
    const displayValue = localEditValue ?? String(value)
    const rule = getRuleForNumericValue(pricingRules, componentId, attribute.code, value)
    const formatPrice = (cents: number) =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      }).format(cents / 100)
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
      <div className="space-y-1.5">
        <Label
          htmlFor={`attr-${attribute.id}`}
          className="text-sm"
        >
          {attribute.label}
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id={`attr-${attribute.id}`}
            type="number"
            className="h-8 text-sm"
            min={attribute.minInt ?? undefined}
            max={attribute.maxInt ?? undefined}
            value={displayValue}
            onChange={(e) => handleIntegerChange(e.target.value)}
            onFocus={() => setLocalEditValue(String(value))}
            onBlur={(e) => commitInteger(e.target.value)}
            placeholder={t("attributes.numberPlaceholder")}
          />
          {displayUnit?.trim() && (
            <span className="shrink-0 text-sm text-muted-foreground">{displayUnit.trim()}</span>
          )}
        </div>
        {rule && (
          <Typography
            as="p"
            variant="body-sm"
            className="text-muted-foreground"
          >
            {t("attributes.priceForRange", { amount: formatPrice(rule.price) })}
          </Typography>
        )}
      </div>
    )
  }

  if (attribute.type === "DECIMAL") {
    const displayUnit = getDisplayAttributeUnit(attribute.unit, attribute.code)
    const value =
      typeof otherValue === "number"
        ? otherValue
        : (attribute.defaultDecimal ?? attribute.minDecimal ?? 0)
    const displayValue = localEditValue ?? String(value)
    const rule = getRuleForNumericValue(pricingRules, componentId, attribute.code, value)
    const formatPrice = (cents: number) =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
      }).format(cents / 100)
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
      <div className="space-y-1.5">
        <Label
          htmlFor={`attr-${attribute.id}`}
          className="text-sm"
        >
          {attribute.label}
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id={`attr-${attribute.id}`}
            type="number"
            step="any"
            className="h-8 text-sm"
            min={attribute.minDecimal ?? undefined}
            max={attribute.maxDecimal ?? undefined}
            value={displayValue}
            onChange={(e) => handleDecimalChange(e.target.value)}
            onFocus={() => setLocalEditValue(String(value))}
            onBlur={(e) => commitDecimal(e.target.value)}
            placeholder={t("attributes.numberPlaceholder")}
          />
          {displayUnit?.trim() && (
            <span className="shrink-0 text-sm text-muted-foreground">{displayUnit.trim()}</span>
          )}
        </div>
        {rule && (
          <Typography
            as="p"
            variant="body-sm"
            className="text-muted-foreground"
          >
            {t("attributes.priceForRange", { amount: formatPrice(rule.price) })}
          </Typography>
        )}
      </div>
    )
  }

  if (attribute.type === "BOOLEAN") {
    const isChecked = typeof otherValue === "boolean" ? otherValue : false
    return (
      <div className="flex items-center gap-2 space-y-0 [&_svg]:size-4">
        <Checkbox
          id={`attr-${attribute.id}`}
          checked={isChecked}
          onCheckedChange={(c) => onOtherChange(c === true)}
        />
        <Label
          htmlFor={`attr-${attribute.id}`}
          className="cursor-pointer text-sm font-normal"
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
  attributeCode: string
  attributeLabel: string
  selectedOption: AttributeOptionDto | null
  onSelectOption: (option: AttributeOptionDto | null, isInitialEnumDefault?: boolean) => void

  options?: AttributeOptionDto[]
  pricingRules?: AttributePricingRuleDto[]
  currency?: string
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

const AttributeSelect = ({
  productModelId,
  componentId,
  attributeId,
  attributeCode,
  attributeLabel,
  selectedOption,
  onSelectOption,
  options: optionsProp,
  pricingRules = [],
  currency = "CZK",
}: AttributeSelectProps) => {
  const t = useTranslations("Configurator")
  const { data: optionsFetched, isLoading } = useAttributeOptionsList(
    productModelId,
    componentId,
    attributeId,
    {
      enabled: Boolean(optionsProp == null && productModelId && componentId && attributeId),
    },
  )

  const options = optionsProp ?? optionsFetched ?? []
  const sortedOptions = [...options].sort((a, b) => a.sortOrder - b.sortOrder)
  const hasSetDefaultRef = useRef(false)

  useEffect(() => {
    const first = sortedOptions[0]
    if (hasSetDefaultRef.current || !first || selectedOption !== null) return
    hasSetDefaultRef.current = true
    onSelectOption(first, true)
  }, [sortedOptions, selectedOption, onSelectOption])

  if (optionsProp == null && isLoading) {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm">{attributeLabel}</Label>
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  const hasImages = sortedOptions.some((o) => o.imageUrl)

  const optionDisplayName = (opt: AttributeOptionDto) => opt.label.trim() || opt.value

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(cents / 100)

  const optionPriceSuffix = (opt: AttributeOptionDto): string | null => {
    const cents = getPriceForOption(pricingRules, componentId, attributeCode, opt.value)
    if (cents == null || cents === 0) return null
    const amount = formatPrice(Math.abs(cents))
    if (cents > 0) return t("attributes.optionPrice", { amount })
    return formatPrice(cents)
  }

  const selectedPriceSuffix = selectedOption != null ? optionPriceSuffix(selectedOption) : null

  return (
    <div className="space-y-1.5">
      <Label
        id={`attr-${attributeId}-label`}
        className="text-sm text-muted-foreground"
      >
        {attributeLabel}
      </Label>
      <div
        role="listbox"
        aria-labelledby={`attr-${attributeId}-label`}
        aria-label={attributeLabel}
        className={cn(
          "grid w-full justify-start gap-2",
          hasImages
            ? "auto-rows-[2.5rem] grid-cols-[repeat(auto-fill,2.5rem)]"
            : "auto-rows-[1.75rem] grid-cols-[repeat(auto-fill,1.75rem)]",
        )}
      >
        {sortedOptions.map((opt, optIndex) => {
          const isSelected = selectedOption?.id === opt.id
          const name = optionDisplayName(opt)
          const priceSuffix = optionPriceSuffix(opt)
          const ariaLabel = priceSuffix ? `${name}, ${priceSuffix}` : name

          return (
            <Tooltip key={opt.id}>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  aria-label={ariaLabel}
                  onClick={() => onSelectOption(opt)}
                  className={cn(
                    "size-full min-w-0 rounded-md border-0 transition-colors",
                    isSelected
                      ? "bg-primary/10"
                      : "bg-neutral-50 hover:bg-neutral-100/90 dark:bg-muted/35 dark:hover:bg-muted/50",
                    hasImages
                      ? "flex items-center justify-center p-0.5"
                      : "flex items-center justify-center p-0",
                  )}
                >
                  {hasImages ? (
                    <div
                      className={cn(
                        "relative aspect-square w-full overflow-hidden rounded-[0.25rem] bg-neutral-50 dark:bg-muted/35",
                        !opt.imageUrl && "flex items-center justify-center",
                      )}
                    >
                      {opt.imageUrl ? (
                        <Image
                          src={getImageUrlForDisplay(opt.imageUrl)}
                          alt=""
                          fill
                          className="object-cover"
                          unoptimized
                          sizes="40px"
                        />
                      ) : (
                        <span
                          className="text-[10px] text-muted-foreground select-none"
                          aria-hidden
                        >
                          ···
                        </span>
                      )}
                    </div>
                  ) : (
                    <span
                      className="flex size-full items-center justify-center text-[10px] font-semibold text-muted-foreground tabular-nums"
                      aria-hidden
                    >
                      {optIndex + 1}
                    </span>
                  )}
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content
                side="top"
                className="max-w-xs"
              >
                <span className="block font-medium">{name}</span>
                {priceSuffix && (
                  <span className="mt-0.5 block text-muted-foreground">{priceSuffix}</span>
                )}
              </Tooltip.Content>
            </Tooltip>
          )
        })}
      </div>
      {selectedOption && (
        <Typography
          as="p"
          variant="body-sm"
          className="text-muted-foreground"
        >
          {t("attributes.enumSelectedPrefix")} {optionDisplayName(selectedOption)}
          {selectedPriceSuffix && (
            <span className="whitespace-nowrap">
              {t("attributes.enumPriceAdjustment", { adjustment: selectedPriceSuffix })}
            </span>
          )}
        </Typography>
      )}
    </div>
  )
}
