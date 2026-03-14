"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckIcon, ChevronDownIcon, ImageIcon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import type { SubmitHandler } from "react-hook-form"
import { useForm } from "react-hook-form"
import { Button } from "@workspace/ui/components/button"
import { Dialog } from "@workspace/ui/components/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import { Popover } from "@workspace/ui/components/popover"
import { Select } from "@workspace/ui/components/select"
import { Typography } from "@workspace/ui/components/typography"
import { cn } from "@workspace/ui/lib/utils"

import { useAttributeOptionsList } from "@/api/attributeOptionQueries"
import { useAttributesList } from "@/api/attributeQueries"
import type { AttributePricingRuleCreateDto, AttributePricingRuleDto } from "@/api/pricingTypes"
import { DualRangeSlider } from "@/components/DualRangeSlider"
import { getImageUrlForDisplay } from "@/utils/imageUrl"

/* eslint-disable-next-line import/no-restricted-paths -- pricing dialog needs components list */
import { useComponentsList } from "@/features/components/api/componentQueries"

import { pricingRuleFormSchema, type PricingRuleFormSchema } from "../schemas/pricingRuleFormSchema"

const NO_COMPONENT_VALUE = "__none__"

const isNumericType = (t: string) => t === "INTEGER" || t === "DECIMAL"

type Props = {
  productModelId: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (body: AttributePricingRuleCreateDto) => Promise<void>
  isSubmitting: boolean
  currency?: string
  /** When set (e.g. from attribute pricing page), component and attribute are preset and hidden. */
  presetComponentId?: string
  presetAttributeCode?: string
  /** When set (e.g. from attribute pricing page), unit/range/type shown before attribute loads. */
  presetNumericUnit?: string | null
  presetNumericRange?: { min: number; max: number }
  /** Existing rules to prevent duplicate rules per ENUM option. */
  existingRules?: AttributePricingRuleDto[]
}

export const CreatePricingRuleDialog = ({
  productModelId,
  isOpen,
  onOpenChange,
  onSubmit,
  isSubmitting,
  currency,
  presetComponentId,
  presetAttributeCode,
  presetNumericUnit,
  presetNumericRange,
  existingRules = [],
}: Props) => {
  const t = useTranslations("Pricing")
  const hasPreset = Boolean(presetComponentId && presetAttributeCode)

  const { data: componentsData } = useComponentsList(productModelId, { limit: 100 })
  const components = componentsData?.items ?? []

  const form = useForm<PricingRuleFormSchema>({
    defaultValues: {
      componentId: presetComponentId ?? NO_COMPONENT_VALUE,
      attributeCode: presetAttributeCode ?? "",
      operator: "EQ",
      value: "",
      toValue: null,
      price: 0,
    },
    resolver: zodResolver(pricingRuleFormSchema),
  })

  const rawComponentId = form.watch("componentId")
  const selectedComponentId =
    hasPreset && presetComponentId
      ? presetComponentId
      : rawComponentId === NO_COMPONENT_VALUE || rawComponentId == null
        ? ""
        : rawComponentId

  const { data: attributesData } = useAttributesList(
    productModelId,
    selectedComponentId,
    { limit: 100 },
    { enabled: Boolean(selectedComponentId) },
  )
  const attributes = [...(attributesData?.items ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)
  const selectedAttributeCode = form.watch("attributeCode")
  const selectedAttribute = attributes.find(
    (a) => a.code === (hasPreset ? presetAttributeCode : selectedAttributeCode),
  )
  const isEnumAttribute = selectedAttribute?.type === "ENUM"
  const isNumericAttribute =
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- boolean OR intent
    (selectedAttribute && isNumericType(selectedAttribute.type)) ||
    (hasPreset && presetNumericRange != null)
  const numericRange: { min: number; max: number } | undefined =
    selectedAttribute && isNumericAttribute
      ? selectedAttribute.type === "INTEGER"
        ? {
            min: selectedAttribute.minInt ?? 0,
            max: selectedAttribute.maxInt ?? 100,
          }
        : {
            min: selectedAttribute.minDecimal ?? 0,
            max: selectedAttribute.maxDecimal ?? 100,
          }
      : presetNumericRange
  const numericUnit = selectedAttribute?.unit?.trim() ?? presetNumericUnit?.trim() ?? null
  const isDecimal = selectedAttribute?.type === "DECIMAL"
  const rangeStep =
    isDecimal && numericRange ? Math.max((numericRange.max - numericRange.min) / 100, 0.01) : 1

  useEffect(() => {
    if (isOpen && hasPreset && presetComponentId && presetAttributeCode) {
      form.reset({
        componentId: presetComponentId,
        attributeCode: presetAttributeCode,
        operator: "EQ",
        value: "",
        toValue: null,
        price: 0,
      })
    }
  }, [isOpen, hasPreset, presetComponentId, presetAttributeCode, form])

  const { data: optionsData } = useAttributeOptionsList(
    productModelId,
    selectedComponentId,
    selectedAttribute?.id ?? "",
    { enabled: Boolean(selectedAttribute?.id && isEnumAttribute) },
  )
  const enumOptions = [...(optionsData ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)

  const effectiveComponentId =
    hasPreset && presetComponentId ? presetComponentId : selectedComponentId
  const effectiveAttributeCode =
    hasPreset && presetAttributeCode ? presetAttributeCode : selectedAttributeCode
  const optionValuesWithExistingRules = (
    effectiveComponentId && effectiveAttributeCode
      ? existingRules.filter(
          (r) =>
            r.operator === "EQ" &&
            r.attributeCode === effectiveAttributeCode &&
            (r.componentId ?? null) === (effectiveComponentId ?? null),
        )
      : []
  ).map((r) => r.value)

  const handleSubmit: SubmitHandler<PricingRuleFormSchema> = async (values) => {
    const componentId =
      values.componentId === NO_COMPONENT_VALUE || values.componentId == null
        ? undefined
        : values.componentId
    const baseBody: Omit<AttributePricingRuleCreateDto, "value" | "toValue"> = {
      componentId,
      attributeCode: values.attributeCode,
      operator: values.operator,
      price: values.price,
    }
    const valuesForSubmit =
      isEnumAttribute && values.operator === "EQ" && values.value.includes(",")
        ? values.value
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
        : [values.value]
    const valuesToCreate = valuesForSubmit.filter((v) => !optionValuesWithExistingRules.includes(v))
    if (valuesToCreate.length === 0) {
      return
    }
    for (const value of valuesToCreate) {
      await onSubmit({
        ...baseBody,
        value,
        toValue: values.toValue ?? undefined,
      })
    }
    onOpenChange(false)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <Dialog.Content>
        <Dialog.Content.Header>
          <Dialog.Content.Header.Title>{t("create.title")}</Dialog.Content.Header.Title>
        </Dialog.Content.Header>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {hasPreset ? (
              <div className="space-y-1">
                <Typography
                  as="p"
                  variant="body-sm"
                  weight="medium"
                  className="text-muted-foreground"
                >
                  {selectedAttribute?.label ?? presetAttributeCode} ({presetAttributeCode})
                </Typography>
              </div>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="componentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("create.componentId")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? NO_COMPONENT_VALUE}
                      >
                        <FormControl>
                          <Select.Trigger>
                            <Select.Trigger.Value placeholder="—" />
                          </Select.Trigger>
                        </FormControl>
                        <Select.Content>
                          <Select.Content.Item value={NO_COMPONENT_VALUE}>—</Select.Content.Item>
                          {components.map((c) => (
                            <Select.Content.Item
                              key={c.id}
                              value={c.id}
                            >
                              {c.label} ({c.code})
                            </Select.Content.Item>
                          ))}
                        </Select.Content>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="attributeCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("create.attributeCode")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                        disabled={!selectedComponentId}
                      >
                        <FormControl>
                          <Select.Trigger>
                            <Select.Trigger.Value
                              placeholder={t("create.attributeCodePlaceholder")}
                            />
                          </Select.Trigger>
                        </FormControl>
                        <Select.Content>
                          {attributes.map((a) => (
                            <Select.Content.Item
                              key={a.id}
                              value={a.code}
                            >
                              {a.label ?? a.code}
                            </Select.Content.Item>
                          ))}
                        </Select.Content>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            <Typography
              as="p"
              variant="body-sm"
              weight="medium"
            >
              {t("create.rangeSection")}
            </Typography>
            <FormField
              control={form.control}
              name="operator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("create.operator")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <Select.Trigger>
                        <Select.Trigger.Value />
                      </Select.Trigger>
                    </FormControl>
                    <Select.Content>
                      <Select.Content.Item value="EQ">{t("list.operatorEq")}</Select.Content.Item>
                      <Select.Content.Item value="BETWEEN">
                        {t("list.operatorBetween")}
                      </Select.Content.Item>
                    </Select.Content>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch("operator") === "BETWEEN" && isNumericAttribute && numericRange ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {numericUnit
                            ? t("create.rangeMinWithUnit", { unit: numericUnit })
                            : t("create.rangeMin")}
                        </FormLabel>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input
                              type="number"
                              step={isDecimal ? 0.01 : 1}
                              min={numericRange.min}
                              max={numericRange.max}
                              placeholder={
                                numericUnit
                                  ? t("create.rangeFromPlaceholderWithUnit", { unit: numericUnit })
                                  : t("create.rangeMinPlaceholder")
                              }
                              {...field}
                            />
                          </FormControl>
                          {numericUnit && (
                            <Typography
                              as="span"
                              variant="body-sm"
                              className="shrink-0 text-muted-foreground"
                            >
                              {numericUnit}
                            </Typography>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="toValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {numericUnit
                            ? t("create.rangeMaxWithUnit", { unit: numericUnit })
                            : t("create.rangeMax")}
                        </FormLabel>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input
                              type="number"
                              step={isDecimal ? 0.01 : 1}
                              min={numericRange.min}
                              max={numericRange.max}
                              placeholder={
                                numericUnit
                                  ? t("create.rangeToPlaceholderWithUnit", { unit: numericUnit })
                                  : t("create.rangeMaxPlaceholder")
                              }
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(e.target.value === "" ? null : e.target.value)
                              }
                            />
                          </FormControl>
                          {numericUnit && (
                            <Typography
                              as="span"
                              variant="body-sm"
                              className="shrink-0 text-muted-foreground"
                            >
                              {numericUnit}
                            </Typography>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DualRangeSlider
                  min={numericRange.min}
                  max={numericRange.max}
                  step={rangeStep}
                  fromValue={Number(form.watch("value") || numericRange.min)}
                  toValue={(() => {
                    const v = form.watch("toValue")
                    return v != null && v !== "" ? Number(v) : numericRange.max
                  })()}
                  onFromChange={(v) => form.setValue("value", String(v))}
                  onToChange={(v) => form.setValue("toValue", String(v))}
                  isSliderOnly
                />
              </>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => {
                    const selectedSet = new Set(
                      field.value
                        ? field.value
                            .split(",")
                            .map((v) => v.trim())
                            .filter(Boolean)
                        : [],
                    )
                    const toggleOption = (optValue: string) => {
                      const next = new Set(selectedSet)
                      if (next.has(optValue)) next.delete(optValue)
                      else next.add(optValue)
                      field.onChange([...next].join(","))
                    }
                    return (
                      <FormItem>
                        <FormLabel>
                          {isEnumAttribute && form.watch("operator") === "EQ"
                            ? t("create.enumOptionsLabel")
                            : t("create.value")}
                        </FormLabel>
                        {isEnumAttribute ? (
                          enumOptions.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              {t("create.enumNoOptions")}
                            </p>
                          ) : form.watch("operator") === "EQ" ? (
                            <Popover>
                              <FormControl>
                                <Popover.Trigger asChild>
                                  <button
                                    type="button"
                                    className={cn(
                                      "flex min-h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-left text-sm transition-colors",
                                      "hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                                      "disabled:cursor-not-allowed disabled:opacity-50",
                                    )}
                                  >
                                    <span className="flex min-w-0 flex-1 flex-wrap gap-2">
                                      {selectedSet.size === 0 ? (
                                        <span className="text-muted-foreground">
                                          {t("create.valuePlaceholderOption")}
                                        </span>
                                      ) : (
                                        Array.from(selectedSet).map((val) => {
                                          const opt = enumOptions.find((o) => o.value === val)
                                          const label = opt ? opt.label || opt.value : val
                                          return (
                                            <span
                                              key={val}
                                              className="inline-flex items-center gap-1 rounded border border-border bg-muted/50 px-2 py-0.5 text-sm text-foreground"
                                            >
                                              {label}
                                              <span
                                                role="button"
                                                tabIndex={0}
                                                onClick={(e) => {
                                                  e.preventDefault()
                                                  e.stopPropagation()
                                                  toggleOption(val)
                                                }}
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault()
                                                    toggleOption(val)
                                                  }
                                                }}
                                                className="cursor-pointer rounded p-0.5 hover:bg-muted"
                                                aria-label={t("create.enumClear")}
                                              >
                                                <XIcon className="size-3.5 text-muted-foreground" />
                                              </span>
                                            </span>
                                          )
                                        })
                                      )}
                                    </span>
                                    <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                                  </button>
                                </Popover.Trigger>
                              </FormControl>
                              <Popover.Content
                                align="start"
                                className="max-h-80 w-[var(--radix-popover-trigger-width)] min-w-[280px] overflow-y-auto rounded-md border bg-popover p-1 shadow-md"
                              >
                                {enumOptions.map((opt) => {
                                  const isSelected = selectedSet.has(opt.value)
                                  const hasExistingRule = optionValuesWithExistingRules.includes(
                                    opt.value,
                                  )
                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      onClick={() => !hasExistingRule && toggleOption(opt.value)}
                                      disabled={hasExistingRule}
                                      title={
                                        hasExistingRule
                                          ? t("create.optionAlreadyHasRule")
                                          : undefined
                                      }
                                      className={cn(
                                        "flex w-full min-w-0 items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm",
                                        "hover:bg-muted/80",
                                        isSelected && "bg-muted/60",
                                        hasExistingRule &&
                                          "cursor-not-allowed opacity-60 hover:bg-transparent",
                                      )}
                                    >
                                      {isSelected ? (
                                        <CheckIcon className="size-3.5 shrink-0 text-foreground" />
                                      ) : (
                                        <span
                                          className="size-3.5 shrink-0"
                                          aria-hidden
                                        />
                                      )}
                                      <div className="relative size-8 shrink-0 overflow-hidden rounded bg-muted">
                                        {opt.imageUrl ? (
                                          <Image
                                            src={getImageUrlForDisplay(opt.imageUrl)}
                                            alt=""
                                            fill
                                            className="object-contain"
                                            unoptimized
                                          />
                                        ) : (
                                          <div className="flex h-full w-full items-center justify-center">
                                            <ImageIcon className="size-3.5 text-muted-foreground" />
                                          </div>
                                        )}
                                      </div>
                                      <span
                                        className={cn(
                                          "min-w-0 flex-1 truncate",
                                          isSelected && "font-medium",
                                        )}
                                        title={opt.label || opt.value}
                                      >
                                        {opt.label || opt.value}
                                      </span>
                                      {hasExistingRule && (
                                        <span className="shrink-0 text-xs text-muted-foreground">
                                          {t("create.optionHasRule")}
                                        </span>
                                      )}
                                    </button>
                                  )
                                })}
                              </Popover.Content>
                            </Popover>
                          ) : (
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <Select.Trigger>
                                  <Select.Trigger.Value
                                    placeholder={t("create.valuePlaceholderOption")}
                                  />
                                </Select.Trigger>
                              </FormControl>
                              <Select.Content>
                                {enumOptions.map((opt) => (
                                  <Select.Content.Item
                                    key={opt.id}
                                    value={opt.value}
                                  >
                                    {opt.label || opt.value}
                                  </Select.Content.Item>
                                ))}
                              </Select.Content>
                            </Select>
                          )
                        ) : (
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g. 100 or OAK_01"
                            />
                          </FormControl>
                        )}
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
                {form.watch("operator") === "BETWEEN" && (
                  <FormField
                    control={form.control}
                    name="toValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("create.rangeTo")}</FormLabel>
                        {isEnumAttribute && enumOptions.length > 0 ? (
                          <Select
                            value={field.value ?? ""}
                            onValueChange={(v) => field.onChange(v || null)}
                          >
                            <FormControl>
                              <Select.Trigger>
                                <Select.Trigger.Value
                                  placeholder={t("create.valuePlaceholderOption")}
                                />
                              </Select.Trigger>
                            </FormControl>
                            <Select.Content>
                              {enumOptions.map((opt) => (
                                <Select.Content.Item
                                  key={opt.id}
                                  value={opt.value}
                                >
                                  {opt.label || opt.value}
                                </Select.Content.Item>
                              ))}
                            </Select.Content>
                          </Select>
                        ) : (
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => field.onChange(e.target.value || null)}
                            />
                          </FormControl>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </>
            )}
            <Typography
              as="p"
              variant="body-sm"
              weight="medium"
            >
              {t("create.priceSection")}
            </Typography>
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem className="pt-3">
                  <FormLabel>{t("create.price")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={field.value != null && field.value !== 0 ? field.value / 100 : ""}
                      onChange={(e) => {
                        const v = e.target.value
                        field.onChange(v === "" ? 0 : Math.round(Number(v) * 100))
                      }}
                    />
                  </FormControl>
                  <Typography
                    as="p"
                    variant="body-sm"
                    className="text-muted-foreground"
                  >
                    {currency
                      ? t("create.priceHintInCurrency", { currency })
                      : t("create.priceHint")}
                  </Typography>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("create.cancelButton")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {t("create.submitButton")}
              </Button>
            </div>
          </form>
        </Form>
      </Dialog.Content>
    </Dialog>
  )
}
