"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useForm } from "react-hook-form"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
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
import { Textarea } from "@workspace/ui/components/textarea"

import type { ProductModelDto } from "@/api/productModelTypes"
import { parseWholeCurrencyInput } from "@/lib/moneyFormat"

import {
  getProductModelEditFormSchema,
  type ProductModelEditFormSchema,
} from "@/features/productModels/schemas/productModelFormSchema"

import { useUpdateProductModel } from "../api/productModelQueries"

type Props = {
  productModel: ProductModelDto
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

const CURRENCIES = ["CZK", "EUR", "USD", "GBP"] as const

export const EditProductModelDialog = ({ productModel, isOpen, onOpenChange }: Props) => {
  const t = useTranslations("ProductModels")
  const updateProductModel = useUpdateProductModel()
  const [priceInput, setPriceInput] = useState(() => String(Math.round(productModel.price)))

  const productModelEditFormSchema = getProductModelEditFormSchema(t)

  const form = useForm<ProductModelEditFormSchema>({
    defaultValues: {
      name: productModel.name,
      description: productModel.description ?? "",
      price: productModel.price,
      currency: productModel.currency,
      isActive: productModel.isActive,
    },
    resolver: zodResolver(productModelEditFormSchema),
  })

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: productModel.name,
        description: productModel.description ?? "",
        price: productModel.price,
        currency: productModel.currency,
        isActive: productModel.isActive,
      })
      setPriceInput(String(Math.round(productModel.price)))
    }
  }, [productModel, isOpen, form])

  const onSubmit = async (values: ProductModelEditFormSchema) => {
    try {
      const patches = []

      if (values.name !== productModel.name) {
        patches.push({
          path: "SlashName" as const,
          value: values.name,
          op: "Replace" as const,
        })
      }

      if (values.description !== (productModel.description ?? "")) {
        patches.push({
          path: "SlashDescription" as const,
          value: values.description ?? null,
          op: "Replace" as const,
        })
      }

      if (values.price !== productModel.price) {
        patches.push({
          path: "SlashPrice" as const,
          value: values.price,
          op: "Replace" as const,
        })
      }

      if (values.currency !== productModel.currency) {
        patches.push({
          path: "SlashCurrency" as const,
          value: values.currency,
          op: "Replace" as const,
        })
      }

      if (values.isActive !== productModel.isActive) {
        patches.push({
          path: "SlashIsActive" as const,
          value: values.isActive,
          op: "Replace" as const,
        })
      }

      if (patches.length > 0) {
        await updateProductModel.mutateAsync({
          id: productModel.id,
          patches,
        })

        onOpenChange(false)
      } else {
        onOpenChange(false)
      }
    } catch (err) {
      console.error("Failed to update product model:", err)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <Dialog.Content>
        <Dialog.Content.Header>
          <Dialog.Content.Header.Title>{t("edit.title")}</Dialog.Content.Header.Title>
          <Dialog.Content.Header.Description>
            {t("edit.dialogDescription")}
          </Dialog.Content.Header.Description>
        </Dialog.Content.Header>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const effectivePrice = parseWholeCurrencyInput(priceInput.trim()) ?? 0
              form.setValue("price", effectivePrice, { shouldValidate: true })
              void form.handleSubmit(onSubmit)(e)
            }}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("edit.name.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("edit.name.placeholder")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("edit.description.label")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("edit.description.placeholder")}
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("edit.price.label")}</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder={t("edit.price.placeholder")}
                        value={priceInput}
                        onChange={(e) => setPriceInput(e.target.value)}
                        onBlur={() => {
                          const p = parseWholeCurrencyInput(priceInput)
                          if (p !== null) {
                            setPriceInput(String(p))
                          } else if (priceInput.trim() === "") {
                            setPriceInput("0")
                          } else {
                            setPriceInput(String(Math.round(productModel.price)))
                          }
                          field.onBlur()
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("edit.currency.label")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <Select.Trigger>
                          <Select.Trigger.Value placeholder={t("edit.currency.placeholder")} />
                        </Select.Trigger>
                      </FormControl>
                      <Select.Content>
                        {CURRENCIES.map((currency) => (
                          <Select.Content.Item
                            key={currency}
                            value={currency}
                          >
                            {currency}
                          </Select.Content.Item>
                        ))}
                      </Select.Content>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>{t("edit.isActive")}</FormLabel>
                    <p className="text-sm text-muted-foreground">{t("edit.isActiveDescription")}</p>
                  </div>
                </FormItem>
              )}
            />

            {updateProductModel.isError && (
              <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
                {updateProductModel.error instanceof Error
                  ? updateProductModel.error.message
                  : t("edit.errorMessages.generalError")}
              </div>
            )}

            <Dialog.Content.Footer>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateProductModel.isPending}
              >
                {t("edit.cancelButton")}
              </Button>
              <Button
                type="submit"
                disabled={updateProductModel.isPending}
              >
                {t("edit.submitButton")}
              </Button>
            </Dialog.Content.Footer>
          </form>
        </Form>
      </Dialog.Content>
    </Dialog>
  )
}
