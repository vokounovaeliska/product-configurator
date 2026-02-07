"use client"

import { zodResolver } from "@hookform/resolvers/zod"
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
import { Select } from "@workspace/ui/components/select"

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

  const handleSubmit: SubmitHandler<PricingRuleFormSchema> = async (values) => {
    const componentId =
      values.componentId === NO_COMPONENT_VALUE || values.componentId == null
        ? undefined
        : values.componentId
    await onSubmit({
      componentId,
      attributeCode: values.attributeCode,
      operator: values.operator,
      value: values.value,
      toValue: values.toValue ?? undefined,
      priceDeltaCents: values.priceDeltaCents,
      pricePerUnitCents: values.pricePerUnitCents ?? undefined,
    })
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("create.value")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. 100 or OAK_01"
                    />
                  </FormControl>
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
                    <FormLabel>{t("create.rangeTo")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
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
