"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import { useAttributeOptionsList } from "@/api/attributeOptionQueries"
import { useAttributesList } from "@/api/attributeQueries"
import type { AttributeDto, AttributeOptionDto } from "@/api/attributeTypes"
import { getImageUrl } from "@/utils/imageUrl"

type Props = {
  componentId: string
  productModelId: string
  selectedOptionsByAttribute: Record<string, AttributeOptionDto | null>
  onSelectOption: (attributeId: string, option: AttributeOptionDto | null) => void
}

export const AttributeConfiguration = ({
  componentId,
  productModelId,
  selectedOptionsByAttribute,
  onSelectOption,
}: Props) => {
  const t = useTranslations("Configurator")
  const [otherValues, setOtherValues] = useState<Record<string, number | boolean>>({})

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

  const handleOtherChange = (attributeId: string, value: number | boolean) => {
    setOtherValues((prev) => ({ ...prev, [attributeId]: value }))
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
}

const AttributeField = ({
  attribute,
  productModelId,
  componentId,
  selectedOption,
  onSelectOption,
  otherValue,
  onOtherChange,
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
    const value = typeof otherValue === "number" ? otherValue : (attribute.minInt ?? 0)
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
      </div>
    )
  }

  if (attribute.type === "DECIMAL") {
    const value = typeof otherValue === "number" ? otherValue : (attribute.minDecimal ?? 0)
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
        className={cn("flex flex-wrap gap-2", hasImages && "grid grid-cols-3 gap-3 sm:grid-cols-4")}
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
                  <div className="relative aspect-square w-full bg-muted">
                    <img
                      src={getImageUrl(opt.imageUrl)}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <span className="w-full truncate px-2 pb-2 text-center text-xs font-medium">
                    {opt.label}
                  </span>
                </>
              ) : (
                <span className="truncate text-sm font-medium">{opt.label}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
