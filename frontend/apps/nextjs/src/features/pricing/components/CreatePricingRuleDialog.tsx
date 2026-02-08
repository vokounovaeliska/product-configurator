"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
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
import { cn } from "@workspace/ui/lib/utils"

import { useAttributeOptionsList } from "@/api/attributeOptionQueries"
import { useAttributesList } from "@/api/attributeQueries"
import type { AttributePricingRuleCreateDto } from "@/api/pricingTypes"

/* eslint-disable-next-line import/no-restricted-paths -- pricing dialog needs components list */
import { useComponentsList } from "@/features/components/api/componentQueries"

import { pricingRuleFormSchema, type PricingRuleFormSchema } from "../schemas/pricingRuleFormSchema"

const NO_COMPONENT_VALUE = "__none__"

type Props = {
  productModelId: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (body: AttributePricingRuleCreateDto) => Promise<void>
  isSubmitting: boolean
  currency?: string
}

export const CreatePricingRuleDialog = ({
  productModelId,
  isOpen,
  onOpenChange,
  onSubmit,
  isSubmitting,
  currency,
}: Props) => {
  const t = useTranslations("Pricing")
  const { data: componentsData } = useComponentsList(productModelId, { limit: 100 })
  const components = componentsData?.items ?? []

  const form = useForm<PricingRuleFormSchema>({
    defaultValues: {
      componentId: NO_COMPONENT_VALUE,
      attributeCode: "",
      operator: "EQ",
      value: "",
      toValue: null,
      priceDeltaCents: 0,
      pricePerUnitCents: null,
    },
    resolver: zodResolver(pricingRuleFormSchema),
  })

  const rawComponentId = form.watch("componentId")
  const selectedComponentId =
    rawComponentId === NO_COMPONENT_VALUE || rawComponentId == null ? "" : rawComponentId
  const { data: attributesData } = useAttributesList(productModelId, selectedComponentId, {
    limit: 100,
  })
  const attributes = [...(attributesData?.items ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)
  const selectedAttributeCode = form.watch("attributeCode")
  const selectedAttribute = attributes.find((a) => a.code === selectedAttributeCode)
  const isEnumAttribute = selectedAttribute?.type === "ENUM"
  const { data: optionsData } = useAttributeOptionsList(
    productModelId,
    selectedComponentId,
    selectedAttribute?.id ?? "",
    { enabled: Boolean(selectedAttribute?.id && isEnumAttribute) },
  )
  const enumOptions = [...(optionsData ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)

  const handleSubmit: SubmitHandler<PricingRuleFormSchema> = async (values) => {
    const componentId =
      values.componentId === NO_COMPONENT_VALUE || values.componentId == null
        ? undefined
        : values.componentId
    const baseBody: Omit<AttributePricingRuleCreateDto, "value" | "toValue"> = {
      componentId,
      attributeCode: values.attributeCode,
      operator: values.operator,
      priceDeltaCents: values.priceDeltaCents,
      pricePerUnitCents: values.pricePerUnitCents ?? undefined,
    }
    const valuesForSubmit =
      isEnumAttribute && values.operator === "EQ" && values.value.includes(",")
        ? values.value
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
        : [values.value]
    for (const value of valuesForSubmit) {
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
                        <Select.Trigger.Value placeholder={t("create.attributeCodePlaceholder")} />
                      </Select.Trigger>
                    </FormControl>
                    <Select.Content>
                      {attributes.map((a) => (
                        <Select.Content.Item
                          key={a.id}
                          value={a.code}
                        >
                          {a.label ?? a.code} ({a.code})
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
                        <p className="text-sm text-muted-foreground">{t("create.enumNoOptions")}</p>
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
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.preventDefault()
                                              e.stopPropagation()
                                              toggleOption(val)
                                            }}
                                            className="rounded p-0.5 hover:bg-muted"
                                            aria-label={t("create.enumClear")}
                                          >
                                            <XIcon className="size-3.5 text-muted-foreground" />
                                          </button>
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
                            className="max-h-60 w-[var(--radix-popover-trigger-width)] overflow-y-auto rounded-md border bg-popover p-1 shadow-md"
                          >
                            {enumOptions.map((opt) => {
                              const isSelected = selectedSet.has(opt.value)
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => toggleOption(opt.value)}
                                  className={cn(
                                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm",
                                    "hover:bg-muted/80",
                                    isSelected && "bg-muted/60",
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
                                  <span className={isSelected ? "font-medium" : ""}>
                                    {opt.label || opt.value}
                                  </span>
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
            <FormField
              control={form.control}
              name="priceDeltaCents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("create.price")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.value !== 0 ? field.value / 100 : ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? 0 : Math.round(Number(e.target.value) * 100),
                        )
                      }
                    />
                  </FormControl>
                  {currency && (
                    <p className="text-xs text-muted-foreground">
                      {t("create.priceHintInCurrency", { currency })}
                    </p>
                  )}
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
