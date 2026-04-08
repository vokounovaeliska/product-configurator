"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
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
import { Select } from "@workspace/ui/components/select"
import { Typography } from "@workspace/ui/components/typography"

import { useAttributesList } from "@/api/attributeQueries"
import type { AttributeDto, AttributeType } from "@/api/attributeTypes"
import type { AttributePricingRuleDto, AttributePricingRuleUpdateDto } from "@/api/pricingTypes"
import { DualRangeSlider } from "@/components/DualRangeSlider"
import { api } from "@/lib/api/restClient"
import { parseMajorUnitsToCents } from "@/lib/moneyFormat"

/* eslint-disable-next-line import/no-restricted-paths -- pricing dialog needs components list */
import { useComponentsList } from "@/features/components/api/componentQueries"

import { pricingRuleFormSchema, type PricingRuleFormSchema } from "../schemas/pricingRuleFormSchema"

type NumericRange = { min: number; max: number }

type AttributeContext = {
  attributeType: AttributeType
  numericRange?: NumericRange
  unit?: string | null
}

type Props = {
  rule: AttributePricingRuleDto
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (body: AttributePricingRuleUpdateDto) => Promise<void>
  isSubmitting: boolean
  /** Base currency of the product model (e.g. CZK). When set, shown in price hints. */
  currency?: string
  /** When set (e.g. from attribute pricing page), component and attribute are hidden and range UI matches Create. */
  fixedAttribute?: { componentId: string; attributeCode: string }
  /** When set with numericRange, Edit shows Min/Max grid + slider like Create. */
  attributeContext?: AttributeContext
  /** Unit (e.g. "mm") for the rule's attribute. When passed (e.g. from price list), Min/Max show unit immediately. */
  attributeUnit?: string | null
}

const isNumericType = (t: AttributeType) => t === "INTEGER" || t === "DECIMAL"

export const EditPricingRuleDialog = ({
  rule,
  isOpen,
  onOpenChange,
  onSubmit,
  isSubmitting,
  currency,
  fixedAttribute,
  attributeContext,
  attributeUnit: attributeUnitProp,
}: Props) => {
  const t = useTranslations("Pricing")
  const [priceMainInput, setPriceMainInput] = useState(() => String(Math.round(rule.price / 100)))
  const { data: componentsData } = useComponentsList(rule.productModelId, {
    limit: 100,
  })
  const components = componentsData?.items ?? []

  const shouldResolveByCode =
    !rule.componentId && !fixedAttribute?.componentId && Boolean(rule.attributeCode)
  const { data: resolvedByCode } = useQuery({
    queryKey: [
      "attributeByCode",
      rule.productModelId,
      rule.attributeCode,
      components
        .map((c) => c.id)
        .sort()
        .join(","),
    ],
    queryFn: async (): Promise<{ attribute: AttributeDto; componentId: string } | null> => {
      for (const comp of components) {
        const res = await api
          .get(
            `products/api/v1/product-models/${rule.productModelId}/components/${comp.id}/attributes`,
            {
              searchParams: { limit: 100 },
            },
          )
          .json<{ items?: AttributeDto[] }>()
        const items = res.items ?? []
        const attr = items.find(
          (a) =>
            a.code === rule.attributeCode ||
            a.code.toLowerCase() === rule.attributeCode.toLowerCase(),
        )
        if (attr) return { attribute: attr, componentId: comp.id }
      }
      return null
    },
    enabled:
      shouldResolveByCode && rule.productModelId.length > 0 && components.length > 0 && isOpen,
  })

  const editComponentId =
    rule.componentId ?? fixedAttribute?.componentId ?? resolvedByCode?.componentId ?? ""
  const { data: attributesData } = useAttributesList(
    rule.productModelId,
    editComponentId,
    { limit: 100 },
    { enabled: Boolean(rule.productModelId && editComponentId) },
  )
  const editAttributes = attributesData?.items ?? []
  const selectedAttribute =
    editAttributes.find(
      (a) =>
        a.code === rule.attributeCode || a.code.toLowerCase() === rule.attributeCode.toLowerCase(),
    ) ??
    resolvedByCode?.attribute ??
    undefined
  const numericRangeFromAttribute =
    selectedAttribute && isNumericType(selectedAttribute.type)
      ? selectedAttribute.type === "INTEGER"
        ? {
            min: selectedAttribute.minInt ?? 0,
            max: selectedAttribute.maxInt ?? 100,
          }
        : {
            min: selectedAttribute.minDecimal ?? 0,
            max: selectedAttribute.maxDecimal ?? 100,
          }
      : undefined
  const valueNum = Number(rule.value)
  const toValueNum = rule.toValue != null && rule.toValue !== "" ? Number(rule.toValue) : null
  const fallbackRange =
    rule.operator === "BETWEEN"
      ? (() => {
          if (!Number.isNaN(valueNum) && (toValueNum == null || !Number.isNaN(toValueNum))) {
            const lo = toValueNum != null ? Math.min(valueNum, toValueNum) : valueNum
            const hi = toValueNum != null ? Math.max(valueNum, toValueNum) : valueNum
            const padding = Math.max(hi - lo || 1, 1)
            return { min: lo - padding, max: hi + padding }
          }
          return { min: 0, max: 100 }
        })()
      : undefined
  const numericRange = attributeContext?.numericRange ?? numericRangeFromAttribute ?? fallbackRange
  const numericUnit =
    attributeContext?.unit?.trim() ??
    selectedAttribute?.unit?.trim() ??
    attributeUnitProp?.trim() ??
    null
  const isDecimal =
    attributeContext?.attributeType === "DECIMAL" || selectedAttribute?.type === "DECIMAL"
  /* eslint-disable @typescript-eslint/prefer-nullish-coalescing -- boolean OR intent */
  const isNumericMode = Boolean(
    (attributeContext && isNumericType(attributeContext.attributeType)) ||
      (selectedAttribute && isNumericType(selectedAttribute.type)) ||
      numericRange != null,
  )
  /* eslint-enable @typescript-eslint/prefer-nullish-coalescing */
  const rangeStep = isDecimal
    ? numericRange
      ? (numericRange.max - numericRange.min) / 100
      : 0.01
    : 1

  const NO_COMPONENT_VALUE = "__none__"
  const form = useForm<PricingRuleFormSchema>({
    defaultValues: {
      componentId: rule.componentId ?? NO_COMPONENT_VALUE,
      attributeCode: rule.attributeCode,
      operator: rule.operator as "EQ" | "BETWEEN",
      value: rule.value,
      toValue: rule.toValue ?? null,
      price: rule.price,
    },
    resolver: zodResolver(pricingRuleFormSchema),
  })

  useEffect(() => {
    if (isOpen) {
      form.reset({
        componentId: rule.componentId ?? NO_COMPONENT_VALUE,
        attributeCode: rule.attributeCode,
        operator: rule.operator as "EQ" | "BETWEEN",
        value: rule.value,
        toValue: rule.toValue ?? null,
        price: rule.price,
      })
      setPriceMainInput(String(Math.round(rule.price / 100)))
    }
  }, [isOpen, rule, form])

  const handleSubmit = async (values: PricingRuleFormSchema) => {
    const priceCents = parseMajorUnitsToCents(priceMainInput.trim())
    if (priceCents === null) {
      return
    }
    await onSubmit({
      componentId:
        values.componentId === NO_COMPONENT_VALUE || values.componentId == null
          ? undefined
          : values.componentId,
      attributeCode: values.attributeCode,
      operator: values.operator,
      value: values.value,
      toValue: values.toValue ?? undefined,
      price: priceCents,
    })
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <Dialog.Content>
        <Dialog.Content.Header>
          <Dialog.Content.Header.Title>{t("edit.title")}</Dialog.Content.Header.Title>
        </Dialog.Content.Header>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const pc = parseMajorUnitsToCents(priceMainInput.trim()) ?? 0
              form.setValue("price", pc, { shouldValidate: true })
              void form.handleSubmit(handleSubmit)(e)
            }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <Typography
                as="p"
                variant="body-sm"
                weight="medium"
                className="text-muted-foreground"
              >
                {selectedAttribute != null
                  ? (selectedAttribute.label ?? selectedAttribute.code)
                  : rule.attributeCode}
              </Typography>
            </div>

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

            {form.watch("operator") === "BETWEEN" && isNumericMode && numericRange ? (
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
                                  ? t("create.rangeFromPlaceholderWithUnit", {
                                      unit: numericUnit,
                                    })
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
                                  ? t("create.rangeToPlaceholderWithUnit", {
                                      unit: numericUnit,
                                    })
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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {form.watch("operator") === "BETWEEN"
                          ? numericUnit
                            ? t("create.rangeFromWithUnit", { unit: numericUnit })
                            : t("create.rangeFrom")
                          : t("create.value")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type={isNumericMode ? "number" : "text"}
                          step={isDecimal ? 0.01 : 1}
                          placeholder={
                            form.watch("operator") === "BETWEEN"
                              ? t("create.rangeFromPlaceholder")
                              : isNumericMode
                                ? "e.g. 800"
                                : "e.g. OAK_01 or 1400"
                          }
                          {...field}
                        />
                      </FormControl>
                      {isNumericMode && numericUnit && (
                        <Typography
                          as="span"
                          variant="body-sm"
                          className="text-muted-foreground"
                        >
                          {numericUnit}
                        </Typography>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("operator") === "BETWEEN" && (
                  <FormField
                    control={form.control}
                    name="toValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {numericUnit
                            ? t("create.rangeToWithUnit", { unit: numericUnit })
                            : t("create.rangeTo")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type={isNumericMode ? "number" : "text"}
                            step={isDecimal ? 0.01 : 1}
                            placeholder={
                              numericUnit
                                ? t("create.rangeToPlaceholderWithUnit", {
                                    unit: numericUnit,
                                  })
                                : t("create.rangeToPlaceholder")
                            }
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value === "" ? null : e.target.value)
                            }
                          />
                        </FormControl>
                        {isNumericMode && numericUnit && (
                          <Typography
                            as="span"
                            variant="body-sm"
                            className="text-muted-foreground"
                          >
                            {numericUnit}
                          </Typography>
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
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="0"
                      value={priceMainInput}
                      onChange={(e) => setPriceMainInput(e.target.value)}
                      onBlur={() => {
                        const p = parseMajorUnitsToCents(priceMainInput.trim())
                        if (p !== null) {
                          setPriceMainInput(String(Math.round(p / 100)))
                          field.onChange(p)
                        } else if (priceMainInput.trim() === "") {
                          setPriceMainInput("0")
                          field.onChange(0)
                        } else {
                          setPriceMainInput(String(Math.round(rule.price / 100)))
                          field.onChange(rule.price)
                        }
                        field.onBlur()
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
                {t("edit.submitButton")}
              </Button>
            </div>
          </form>
        </Form>
      </Dialog.Content>
    </Dialog>
  )
}
